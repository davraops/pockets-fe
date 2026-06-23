#!/usr/bin/env python3
from pathlib import Path
import re

path = Path('src/pages/Transacciones.tsx')
text = path.read_text()

if 'transactionMutation' not in text:
    text = text.replace(
        "import { emitFinanceEvent } from '../utils/financeEvents'\n",
        "import { emitFinanceEvent } from '../utils/financeEvents'\n"
        "import { emitTransactionSyncEvents } from '../utils/transactionMutation'\n",
    )

marker = '  const calculateTotals = () => {'
if 'syncAfterTransactionMutation' not in text:
    insert = (
        '  const syncAfterTransactionMutation = async () => {\n'
        '    await reloadTransactions()\n'
        '    emitTransactionSyncEvents()\n'
        '  }\n\n'
    )
    text = text.replace(marker, insert + marker, 1)

delete_pat = re.compile(
    r'  const handleDeleteClick = async \(\) => \{.*?^  \}\n\n  // Función para recargar transacciones',
    re.MULTILINE | re.DOTALL,
)
delete_repl = '''  const handleDeleteClick = async () => {
    if (!selectedTransaction) return

    if (
      await confirm({
        message: '¿Estás seguro de que quieres eliminar esta transacción?',
        variant: 'danger',
      })
    ) {
      try {
        setIsLoading(true)
        await api.deleteTransaction(selectedTransaction.id)
        handleCloseDetailModal()
        await syncAfterTransactionMutation()
        showSuccess('Transacción eliminada exitosamente')
      } catch (err: any) {
        devError('Error al eliminar transacción:', err)
        showError(
          getTranslatedErrorMessage(
            err,
            'Error al eliminar la transacción. Por favor, intenta de nuevo.'
          )
        )
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Función para recargar transacciones'''
text, n_del = delete_pat.subn(delete_repl, text, count=1)
print('handleDeleteClick replaced:', n_del)

create_pat = re.compile(
    r'      \} else \{\n        // Crear nueva transacción con rollback manual[\s\S]*?'
    r'        \} finally \{\n          setIsLoading\(false\)\n          setIsSubmitting\(false\)\n        \}\n      \}\n'
    r'    \} catch \(err: any\) \{\n      devError\(\'Error al guardar transacción:\', err\)',
)
create_repl = '''      } else {
        try {
          await api.createTransaction(transactionData)
          handleCloseModal()
          await syncAfterTransactionMutation()
        } catch (err: any) {
          devError('Error al guardar transacción:', err)
          showError(
            getTranslatedErrorMessage(
              err,
              'Error al guardar la transacción. Por favor, intenta de nuevo.'
            )
          )
        } finally {
          setIsLoading(false)
          setIsSubmitting(false)
        }
      }
    } catch (err: any) {
      devError('Error al guardar transacción:', err)'''
text, n_create = create_pat.subn(create_repl, text, count=1)
print('create branch replaced:', n_create)

text = text.replace(
    "          await reloadTransactions()\n"
    "          emitFinanceEvent('budgetsUpdated')\n"
    "          emitFinanceEvent('debtsUpdated')\n"
    "          emitFinanceEvent('debtorsUpdated')",
    '          await syncAfterTransactionMutation()',
    1,
)

delete_all_pat = re.compile(
    r'  const handleDeleteAllTransactions = async \(\) => \{[\s\S]*?^  \}\n\n  const handleCreateDemoIncomes',
    re.MULTILINE,
)
delete_all_repl = '''  const handleDeleteAllTransactions = async () => {
    if (!isDestructiveDebugEnabled()) return
    if (
      (await confirm({
        message:
          '⚠️ ¿Estás seguro de que quieres eliminar TODAS las transacciones? Esta acción es IRREVERSIBLE.',
        variant: 'danger',
      }))
    ) {
      try {
        setIsLoading(true)
        await api.deleteAllTransactions()
        await syncAfterTransactionMutation()
        setIsDebugModalOpen(false)
        showNotification('Todas las transacciones han sido eliminadas exitosamente.', 'success')
      } catch (err: any) {
        devError('Error al eliminar todas las transacciones:', err)
        showNotification(
          getTranslatedErrorMessage(
            err,
            'Error al eliminar todas las transacciones. Por favor, intenta de nuevo.'
          ),
          'error'
        )
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleCreateDemoIncomes'''
text, n_delete_all = delete_all_pat.subn(delete_all_repl, text, count=1)
print('handleDeleteAll replaced:', n_delete_all)

# Demo incomes
text = re.sub(
    r'      // Obtener cuenta bancaria para actualizar balance[\s\S]*?await reloadTransactions\(\)\n      setIsDebugModalOpen\(false\)\n      showNotification\(`\$\{demoIncomes\.length\}',
    '''      for (const income of demoIncomes) {
        await api.createTransaction({
          date: income.date,
          type: 'ingreso',
          amount: income.amount,
          description: income.description,
          category: income.category,
          currency: 'COP',
          bank_account_id: accountId,
        })
      }

      await syncAfterTransactionMutation()
      setIsDebugModalOpen(false)
      showNotification(`${demoIncomes.length}''',
    text,
    count=1,
)

path.write_text(text)
print('lines:', len(text.splitlines()))

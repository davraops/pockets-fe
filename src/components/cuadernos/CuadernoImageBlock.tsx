import type { CuadernoBlock } from './cuadernoDocument'

interface CuadernoImageBlockProps {
  block: CuadernoBlock
  mode: 'edit' | 'read'
}

function CuadernoImageBlock({ block, mode }: CuadernoImageBlockProps) {
  const src = block.imageSrc
  if (!src) {
    return null
  }

  const alt = block.imageAlt?.trim() || 'Imagen del cuaderno'

  return (
    <figure className={`cuaderno-image-block cuaderno-image-block--${mode}`}>
      <img className="cuaderno-image-block__img" src={src} alt={alt} loading="lazy" decoding="async" />
    </figure>
  )
}

export default CuadernoImageBlock

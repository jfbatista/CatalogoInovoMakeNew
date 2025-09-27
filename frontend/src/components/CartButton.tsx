interface CartButtonProps {
  itemCount: number
  onClick: () => void
}

export function CartButton({ itemCount = 0, onClick }: CartButtonProps) {
  return (
    <button 
      onClick={onClick}
      className="relative flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-hover transition-all duration-300 shadow-glow hover:shadow-lg"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5" 
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
      </svg>
      Carrinho
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-white text-[var(--color-primary)] text-xs font-bold rounded-full">
          {itemCount}
        </span>
      )}
    </button>
  )
}
// Описываем, какие данные "функция" принимает на вход (как аргументы в C)
interface ProductCardProps {
    product: {
        id: number;
        name: string;
        price: number;
        description: string;
    };
    onAdd: (p: any) => void;
}

export const ProductCard = ({ product, onAdd }: ProductCardProps) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-xl border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                    {product.name}
                </h3>
            </div>

            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                {product.description}
            </p>

            <div className="flex items-center justify-between mt-auto">
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider text-left">Цена</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">⭐ {product.price}</span>
                </div>

                <button
                    onClick={() => onAdd(product)}
                    className="bg-green-600 hover:bg-green-700 active:scale-90 transition-all text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-green-200 dark:shadow-none"
                >
                    Купить
                </button>
            </div>
        </div>
    );
};
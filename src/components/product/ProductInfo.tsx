
import { Product } from '../../services/ProductService'; // Correct import

interface ProductInfoProps {
    product: Product;
    productName: string;
    formatCurrency: (value: number) => string;
    t: (key: string, params?: any) => string;
}

export function ProductInfo({ product, productName, formatCurrency, t }: ProductInfoProps) {
    return (
        <div>
            <h1 className="text-3xl lg:text-4xl text-lyvest-600 font-normal mb-2 leading-tight">
                {productName}
            </h1>
            <p className="text-slate-500 text-sm">
                {t('products.brand')}: <span className="text-lyvest-500 font-bold">Ly Vest</span>
            </p>

            <div className="h-px bg-slate-100 w-full my-6" />

            {/* Price */}
            <div>
                <span className="text-slate-400 line-through text-sm">de: R$ {(product.price * 1.2).toFixed(2).replace('.', ',')}</span>
                <div className="flex items-end gap-2 mb-1">
                    <span className="text-lg text-slate-800 font-bold mb-1">{t('products.priceBy') || 'por:'}</span>
                    <span className="text-4xl font-bold text-slate-900">{formatCurrency(product.price)}</span>
                </div>
                <p className="text-lyvest-600 text-sm font-medium">
                    {t('products.installments', { installments: 3, amount: formatCurrency(product.price / 3) })}
                </p>
            </div>
        </div>
    );
}

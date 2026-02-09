'use client';
import { useState, ChangeEvent, FormEvent } from 'react';
import { MapPin, User, Phone, Check, AlertCircle, FileText, LucideIcon } from 'lucide-react';
import { addressSchema, validateForm, formatCEP, formatPhone, formatDocument, sanitizeString } from '../../utils/validation';
import { detectXSS } from '../../utils/security';
import { useI18n } from '../../hooks/useI18n';

// Types
export type AddressFormData = {
    name: string;
    document: string;
    phone: string;
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
};

type AddressDataToSubmit = Omit<AddressFormData, 'document'> & {
    document: string;
};

interface CheckoutAddressProps {
    onSubmit: (data: AddressDataToSubmit) => void;
    initialData?: AddressFormData;
}

interface InputFieldProps {
    name: keyof AddressFormData;
    placeholder: string;
    type?: string;
    icon?: LucideIcon;
    autoComplete?: string;
    required?: boolean;
    inputMode?: 'text' | 'numeric' | 'tel' | 'email';
    maxLength?: number;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    t: (key: string) => string;
    isRTL: boolean;
}

// Validation errors type
type ValidationErrors = Record<string, string | undefined>;

// Component moved outside to prevent re-renders
const InputField = ({ name, placeholder, type = 'text', icon: Icon, autoComplete, required = true, inputMode, maxLength, value, onChange, error, t, isRTL }: InputFieldProps) => (
    <div className="relative">
        {Icon && (
            <Icon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400`} />
        )}
        <input
            id={name}
            type={type}
            name={name}
            required={required}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            autoComplete={autoComplete}
            inputMode={inputMode}
            maxLength={maxLength}
            className={`w-full ${Icon ? (isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4') : 'px-4'} py-3 rounded-xl border ${error
                ? 'border-red-400 bg-lyvest-100/30'
                : 'border-slate-200'
                } focus:outline-none focus:ring-2 focus:ring-[#E8C4C8] transition-all font-medium text-slate-700`}
        />
        {error && (
            <p className="text-[#F5E6E8]/300 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {t(error)}
            </p>
        )}
    </div>
);

export default function CheckoutAddress({ onSubmit, initialData }: CheckoutAddressProps) {
    const { t, isRTL } = useI18n();
    const [formData, setFormData] = useState<AddressFormData>(initialData || {
        name: '',
        document: '',
        phone: '',
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: ''
    });

    const [errors, setErrors] = useState<ValidationErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Generic handler with XSS protection
    const handleChange = (field: keyof AddressFormData) => (e: ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;

        // Detect XSS
        if (detectXSS(value)) {
            setErrors(prev => ({ ...prev, [field]: t('errors.invalidCharacters') || 'Caracteres invÃ¡lidos' }));
            return;
        }

        // Automatic formatting
        if (field === 'cep') {
            value = formatCEP(value);
        } else if (field === 'phone') {
            value = formatPhone(value);
        } else if (field === 'document') {
            value = formatDocument(value);
        } else if (field === 'state') {
            value = value.toUpperCase().slice(0, 2);
        }

        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear field error
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        // Prepare data for validation
        const dataToValidate = {
            name: formData.name,
            document: formData.document,
            cep: formData.cep.replace('-', ''),
            street: formData.street,
            number: formData.number,
            complement: formData.complement || '',
            neighborhood: formData.neighborhood,
            city: formData.city,
            state: formData.state,
            phone: formData.phone
        };

        // Validate with Zod
        const validation = validateForm(addressSchema, dataToValidate);

        if (!validation.success) {
            setErrors(validation.errors as ValidationErrors);
            setIsSubmitting(false);
            return;
        }

        // Sanitize final data
        // We know validation.data matches the schema structure, basically AddressFormData but sanitized
        // Casting loosely here as validation creates a new object
        const sanitizedData = {
            ...validation.data,
            name: sanitizeString(validation.data.name),
            street: sanitizeString(validation.data.street),
            neighborhood: sanitizeString(validation.data.neighborhood),
            city: sanitizeString(validation.data.city)
        } as unknown as AddressDataToSubmit;

        // Simulate processing
        setTimeout(() => {
            setIsSubmitting(false);
            onSubmit(sanitizedData);
        }, 500);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-lyvest-500" /> {t('checkout.address.title')}
            </h2>

            {/* General error */}
            {errors._form && (
                <div className="bg-lyvest-100/30 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{errors._form}</span>
                </div>
            )}

            <div className="grid grid-cols-12 gap-4">
                {/* Full Name - Full Width */}
                <div className="col-span-12">
                    <InputField
                        name="name"
                        placeholder={t('checkout.address.name')}
                        icon={User}
                        autoComplete="name"
                        maxLength={100}
                        value={formData.name}
                        onChange={handleChange('name')}
                        error={errors.name}
                        t={t}
                        isRTL={isRTL}
                    />
                </div>

                {/* Line 2: CPF/CNPJ + Phone */}
                <div className="col-span-12 sm:col-span-6">
                    <InputField
                        name="document"
                        placeholder={t('checkout.address.document') || 'CPF / CNPJ'}
                        icon={FileText}
                        maxLength={18}
                        value={formData.document}
                        onChange={handleChange('document')}
                        error={errors.document}
                        t={t}
                        isRTL={isRTL}
                    />
                </div>
                <div className="col-span-12 sm:col-span-6">
                    <InputField
                        name="phone"
                        placeholder={t('checkout.address.phone')}
                        type="tel"
                        icon={Phone}
                        autoComplete="tel"
                        inputMode="tel"
                        maxLength={15}
                        value={formData.phone}
                        onChange={handleChange('phone')}
                        error={errors.phone}
                        t={t}
                        isRTL={isRTL}
                    />
                </div>

                {/* Line 3: CEP + State + City */}
                {/* Mobile: CEP (6) + State (6) | City (12) */}
                <div className="col-span-6 sm:col-span-3">
                    <InputField
                        name="cep"
                        placeholder={t('checkout.address.cep')}
                        autoComplete="postal-code"
                        inputMode="numeric"
                        maxLength={9}
                        value={formData.cep}
                        onChange={handleChange('cep')}
                        error={errors.cep}
                        t={t}
                        isRTL={isRTL}
                    />
                </div>
                <div className="col-span-6 sm:col-span-2">
                    <InputField
                        name="state"
                        placeholder={t('checkout.address.state')}
                        autoComplete="address-level1"
                        maxLength={2}
                        value={formData.state}
                        onChange={handleChange('state')}
                        error={errors.state}
                        t={t}
                        isRTL={isRTL}
                    />
                </div>
                <div className="col-span-12 sm:col-span-7">
                    <InputField
                        name="city"
                        placeholder={t('checkout.address.city')}
                        autoComplete="address-level2"
                        maxLength={100}
                        value={formData.city}
                        onChange={handleChange('city')}
                        error={errors.city}
                        t={t}
                        isRTL={isRTL}
                    />
                </div>

                {/* Line 4: Street + Number */}
                <div className="col-span-12 sm:col-span-9">
                    <InputField
                        name="street"
                        placeholder={t('checkout.address.street')}
                        autoComplete="street-address"
                        maxLength={200}
                        value={formData.street}
                        onChange={handleChange('street')}
                        error={errors.street}
                        t={t}
                        isRTL={isRTL}
                    />
                </div>
                <div className="col-span-12 sm:col-span-3">
                    <InputField
                        name="number"
                        placeholder={t('checkout.address.number')}
                        autoComplete="address-line2"
                        maxLength={20}
                        value={formData.number}
                        onChange={handleChange('number')}
                        error={errors.number}
                        t={t}
                        isRTL={isRTL}
                    />
                </div>

                {/* Line 5: Complement + Neighborhood */}
                <div className="col-span-12 sm:col-span-6">
                    <InputField
                        name="complement"
                        placeholder={t('checkout.address.complement')}
                        required={false}
                        autoComplete="address-line2"
                        maxLength={100}
                        value={formData.complement}
                        onChange={handleChange('complement')}
                        error={errors.complement}
                        t={t}
                        isRTL={isRTL}
                    />
                </div>
                <div className="col-span-12 sm:col-span-6">
                    <InputField
                        name="neighborhood"
                        placeholder={t('checkout.address.neighborhood')}
                        autoComplete="address-level3"
                        maxLength={100}
                        value={formData.neighborhood}
                        onChange={handleChange('neighborhood')}
                        error={errors.neighborhood}
                        t={t}
                        isRTL={isRTL}
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-lyvest-500 transition-all shadow-lg hover:glare-effect flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t('common.loading') || 'Validando...'}
                    </>
                ) : (
                    <>
                        {t('checkout.buttons.next')} <Check className="w-5 h-5" />
                    </>
                )}
            </button>
        </form>
    );
}









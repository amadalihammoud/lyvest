import React, { useState } from 'react';
import { MapPin, User, Phone, Check, AlertCircle, FileText } from 'lucide-react';
import { addressSchema, validateForm, formatCEP, formatPhone, formatDocument, sanitizeString } from '../utils/validation';
import { detectXSS } from '../utils/security';
import { useI18n } from '../hooks/useI18n';

// Component moved outside to prevent re-renders
const InputField = ({ name, placeholder, type = 'text', icon: Icon, autoComplete, required = true, inputMode, maxLength, value, onChange, error, t, isRTL }) => (
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

export default function CheckoutAddress({ onSubmit, initialData }) {
    const { t, isRTL } = useI18n();
    const [formData, setFormData] = useState(initialData || {
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

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handler genérico com proteção XSS
    const handleChange = (field) => (e) => {
        let value = e.target.value;

        // Detectar XSS
        if (detectXSS(value)) {
            setErrors(prev => ({ ...prev, [field]: t('errors.invalidCharacters') || 'Caracteres inválidos' }));
            return;
        }

        // Formatação automática
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

        // Limpar erro do campo
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        // Preparar dados para validação
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

        // Validar com Zod
        const validation = validateForm(addressSchema, dataToValidate);

        if (!validation.success) {
            setErrors(validation.errors);
            setIsSubmitting(false);
            return;
        }

        // Sanitizar dados finais
        const sanitizedData = {
            ...validation.data,
            name: sanitizeString(validation.data.name),
            street: sanitizeString(validation.data.street),
            neighborhood: sanitizeString(validation.data.neighborhood),
            city: sanitizeString(validation.data.city)
        };

        // Simular processamento
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

            {/* Erro geral */}
            {errors._form && (
                <div className="bg-lyvest-100/30 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{t(errors._form)}</span>
                </div>
            )}

            <div className="grid grid-cols-12 gap-4">
                {/* Nome Completo - Full Width */}
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

                {/* Linha 2: CPF/CNPJ + Telefone */}
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
                        inputMode="numeric"
                        maxLength={15}
                        value={formData.phone}
                        onChange={handleChange('phone')}
                        error={errors.phone}
                        t={t}
                        isRTL={isRTL}
                    />
                </div>

                {/* Linha 3: CEP + Estado + Cidade */}
                {/* Mobile: CEP (6) + Estado (6) | Cidade (12) */}
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

                {/* Linha 4: Rua + Número */}
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

                {/* Linha 5: Complemento + Bairro */}
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








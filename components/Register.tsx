import React, { useState } from 'react';
import {
  User,
  Shield,
  Mail,
  Phone,
  Building,
  ChevronRight,
  Loader,
  AlertCircle,
} from 'lucide-react';
import { PARTENAIRE_TYPES, PartenaireType, RegistrationPayload } from '../types';

interface RegisterProps {
  onRegister: (payload: RegistrationPayload) => Promise<{ message: string }>;
  onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onRegister, onSwitchToLogin }) => {
  const [orgName, setOrgName] = useState('');
  const [orgNameFull, setOrgNameFull] = useState('');
  const [orgType, setOrgType] = useState<PartenaireType>(PARTENAIRE_TYPES[0]);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!orgName || !orgNameFull || !contactEmail || !password || !confirmPassword) {
      setError('Les champs marqués * sont obligatoires.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);

    try {
      const result = await onRegister({
        orgName,
        orgNameFull,
        orgType,
        contactName,
        contactEmail,
        contactPhone,
        password,
      } as any); // Cast to any or update type to include password
      setSuccess(result.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue.';
      setError(`L'enregistrement a échoué: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-md mx-auto bg-white shadow-2xl rounded-xl p-8 text-center">
          <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-5">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Compte créé avec succès</h2>
          <p className="text-gray-600 mb-6">{success}</p>
          <button
            onClick={onSwitchToLogin}
            className="w-full inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-md text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
          >
            Retour à la Connexion
            <ChevronRight className="h-5 w-5 ml-2" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Shield className="h-12 w-auto text-blue-800" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Enregistrer votre Organisation
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Créez un compte pour accéder au portail.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <InputField
              id="orgName"
              label="Nom de l'organisation (acronyme) *"
              Icon={Building}
              value={orgName}
              onChange={setOrgName}
              placeholder="Ex: MSF, COOPI, UNHCR"
              disabled={loading}
              required
            />
            <InputField
              id="orgNameFull"
              label="Nom complet de l'organisation *"
              Icon={Building}
              value={orgNameFull}
              onChange={setOrgNameFull}
              placeholder="Ex: Médecins Sans Frontières"
              disabled={loading}
              required
            />
            <SelectField
              id="orgType"
              label="Type d'organisation *"
              value={orgType}
              onChange={setOrgType}
              options={PARTENAIRE_TYPES}
              disabled={loading}
            />
            <InputField
              id="contactName"
              label="Nom du contact"
              Icon={User}
              value={contactName}
              onChange={setContactName}
              placeholder="Ex: Jean Dupont"
              disabled={loading}
            />
            <InputField
              id="contactEmail"
              label="E-mail du contact *"
              Icon={Mail}
              type="email"
              value={contactEmail}
              onChange={setContactEmail}
              placeholder="email@organisation.org"
              disabled={loading}
              required
            />
            <InputField
              id="contactPhone"
              label="Téléphone du contact"
              Icon={Phone}
              value={contactPhone}
              onChange={setContactPhone}
              placeholder="+235 60 00 00 00"
              disabled={loading}
            />
            <InputField
              id="password"
              label="Mot de passe *"
              Icon={Shield}
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Minimum 8 caractères"
              disabled={loading}
              required
            />
            <InputField
              id="confirmPassword"
              label="Confirmer le mot de passe *"
              Icon={Shield}
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Répétez le mot de passe"
              disabled={loading}
              required
            />

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader className="animate-spin h-5 w-5 text-white" />
                ) : (
                  "Demander l'identifiant"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Déjà enregistré ?</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={onSwitchToLogin}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper components for form fields
interface InputFieldProps {
  id: string;
  label: string;
  Icon: React.ElementType;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  Icon,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled,
  required,
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <div className="mt-1 relative rounded-md shadow-sm">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        disabled={disabled}
        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pl-10"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  </div>
);

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: any) => void;
  options: readonly string[];
  disabled?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({
  id,
  label,
  value,
  onChange,
  options,
  disabled,
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <select
      id={id}
      name={id}
      disabled={disabled}
      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

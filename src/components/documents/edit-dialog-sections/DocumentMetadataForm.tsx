import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Airport } from '@/shared/types';
import { useDocumentCodeConfig } from '@/hooks/useDocumentCodeConfig';

interface DocumentMetadataFormProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  user: any;
  initialDepartmentCode: string | undefined;
}

export const DocumentMetadataForm: React.FC<DocumentMetadataFormProps> = ({
  formData,
  setFormData,
  user,
  initialDepartmentCode,
}) => {
  const { config: codeConfig } = useDocumentCodeConfig();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titre du document *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, title: e.target.value }))}
          placeholder="Entrez le titre du document"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company_code">Code Société</Label>
        <Input
          id="company_code"
          value={formData.company_code}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, company_code: e.target.value }))}
          placeholder="Ex: TAVTUN"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="airport">Aéroport (Scope) *</Label>
        <Select
          value={formData.airport}
          onValueChange={(value: Airport) => setFormData((prev: any) => ({ ...prev, airport: value }))}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un aéroport" />
          </SelectTrigger>
          <SelectContent>
            {codeConfig?.scopes.map((scope) => (
              <SelectItem key={scope.code} value={scope.code}>
                {scope.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="document_type_code">Type de document *</Label>
        <Select
          value={formData.document_type_code}
          onValueChange={(value: string) => setFormData((prev: any) => ({ ...prev, document_type_code: value }))}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un type" />
          </SelectTrigger>
          <SelectContent>
            {codeConfig?.documentTypes.map((docType) => (
              <SelectItem key={docType.code} value={docType.code}>
                {docType.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="department_code">Département *</Label>
        <Select
          value={formData.department_code}
          onValueChange={(value: string) => setFormData((prev: any) => ({ ...prev, department_code: value }))}
          required
          disabled={!!user?.department && formData.department_code === initialDepartmentCode && initialDepartmentCode !== undefined}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un département" />
          </SelectTrigger>
          <SelectContent>
            {codeConfig?.departments.map((dept) => (
              <SelectItem key={dept.code} value={dept.code}>
                {dept.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {user?.department && initialDepartmentCode !== undefined && (
          <p className="text-xs text-gray-500">
            Département pré-rempli ({user.department})
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sub_department_code">Sous-département</Label>
        <Select
          value={formData.sub_department_code}
          onValueChange={(value: string) => setFormData((prev: any) => ({ ...prev, sub_department_code: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un sous-département" />
          </SelectTrigger>
          <SelectContent>
            {codeConfig?.subDepartments.map((subDept) => (
              <SelectItem key={subDept.code} value={subDept.code}>
                {subDept.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="language_code">Langue *</Label>
        <Select
          value={formData.language_code}
          onValueChange={(value: string) => setFormData((prev: any) => ({ ...prev, language_code: value }))}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une langue" />
          </SelectTrigger>
          <SelectContent>
            {codeConfig?.languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sequence_number">Numéro de Séquence *</Label>
        <Input
          id="sequence_number"
          type="number"
          value={formData.sequence_number}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, sequence_number: e.target.value }))}
          placeholder="Ex: 001"
          required
        />
        <p className="text-xs text-gray-500">
          Numéro unique pour cette combinaison de codes.
        </p>
      </div>
    </div>
  );
};
import { cn } from '@/lib/utils';

export interface FormSectionRootProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

function FormSectionRoot({ children, className, ...props }: FormSectionRootProps) {
  return (
    <section
      className={cn(
        'space-y-4 rounded-2xl border border-primary/5 bg-surface p-4 shadow-sm',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export interface FormSectionTitleProps {
  icon: React.ReactNode;
  children: React.ReactNode;
}

function FormSectionTitle({ icon, children }: FormSectionTitleProps) {
  return (
    <div className="flex items-center gap-2 border-b border-container-base pb-2">
      <span className="shrink-0 text-secondary" aria-hidden="true">
        {icon}
      </span>
      <h2 className="text-xs font-bold text-secondary">{children}</h2>
    </div>
  );
}

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  isRequired?: boolean;
  error?: string;
  helperText?: string;
  /** Set when the child control (e.g. Textarea) renders its own error/helper slot. */
  hideMessageSlot?: boolean;
  children: React.ReactNode;
}

function FormField({
  label,
  htmlFor,
  isRequired,
  error,
  helperText,
  hideMessageSlot = false,
  children,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="cursor-pointer px-1 text-xs font-bold text-secondary">
        {label}
        {isRequired ? <span className="text-error"> *</span> : null}
      </label>

      {children}

      {hideMessageSlot ? null : (
        <div className="min-h-[16px] px-1 text-[11px]">
          {error ? (
            <span className="font-medium text-error">{error}</span>
          ) : helperText ? (
            <span className="text-secondary">{helperText}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}

export const FormSection = {
  Root: FormSectionRoot,
  Title: FormSectionTitle,
  Field: FormField,
};

export default FormSection;

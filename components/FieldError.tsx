import React from 'react';
import type { FormikProps } from 'formik';

type FormikLike = Pick<FormikProps<unknown>, 'touched' | 'errors' | 'submitCount'>;

/** Show inline error after blur or a failed submit attempt. */
export function showFieldError(formik: FormikLike, name: string): boolean {
  const message = getFieldError(formik, name);
  if (!message) return false;
  const touched = (formik.touched as Record<string, boolean | undefined>)[name];
  return Boolean(touched) || formik.submitCount > 0;
}

export function getFieldError(formik: Pick<FormikProps<unknown>, 'errors'>, name: string): string | undefined {
  const err = (formik.errors as Record<string, unknown>)[name];
  return typeof err === 'string' ? err : undefined;
}

export const FieldError: React.FC<{ formik: FormikLike; name: string }> = ({ formik, name }) => {
  if (!showFieldError(formik, name)) return null;
  const message = getFieldError(formik, name);
  if (!message) return null;
  return (
    <p className="mt-1 text-xs text-red-600" role="alert">
      {message}
    </p>
  );
};

/** Red border when the field failed validation. */
export function inputErrorClasses(invalid: boolean, base: string): string {
  return invalid ? `${base} border-red-400 focus:border-red-500 focus:ring-red-500` : base;
}

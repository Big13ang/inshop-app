import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EditShopSocialInputs } from '../EditShopSocialInputs';
import { profileSchema, type profileSchemaType } from '../../editProfileSchema';

function FormWrapper({ followerCount = '', instagram = '' }) {
  const methods = useForm<profileSchemaType>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: { followerCount, instagram },
  });

  return (
    <FormProvider {...methods}>
      <EditShopSocialInputs />
    </FormProvider>
  );
}

describe('EditShopSocialInputs', () => {
  it('renders both inputs with default values', () => {
    render(<FormWrapper followerCount="250" instagram="form_store" />);

    expect(screen.getByLabelText('تعداد دنبال‌کننده')).toHaveValue('250');
    expect(screen.getByLabelText('آیدی اینستاگرام')).toHaveValue('form_store');
  });

  it('keeps follower count a text field that accepts digits only', async () => {
    const user = userEvent.setup();
    render(<FormWrapper />);

    const input = screen.getByLabelText('تعداد دنبال‌کننده');
    expect(input).toHaveAttribute('type', 'text');

    await user.type(input, '1a۲b.-3');

    expect(input).toHaveValue('123');
  });

  it('strips leading @ from the instagram id', async () => {
    const user = userEvent.setup();
    render(<FormWrapper />);

    const input = screen.getByLabelText('آیدی اینستاگرام');
    await user.type(input, '@new_handle');

    expect(input).toHaveValue('new_handle');
  });

  it('shows the username validation errors for the instagram id', async () => {
    const user = userEvent.setup();
    render(<FormWrapper />);

    const input = screen.getByLabelText('آیدی اینستاگرام');
    await user.type(input, 'ab');
    expect(await screen.findByText('آیدی اینستاگرام باید حداقل ۳ کاراکتر باشد')).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, 'bad..name');
    expect(await screen.findByText('آیدی اینستاگرام فرمت معتبر ندارد')).toBeInTheDocument();
  });
});

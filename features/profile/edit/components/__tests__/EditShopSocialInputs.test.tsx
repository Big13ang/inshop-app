import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { EditShopSocialInputs } from '../EditShopSocialInputs';
import type { profileSchemaType } from '../../editProfileSchema';

describe('EditShopSocialInputs', () => {
  it('renders follower count and Instagram inputs with given props', () => {
    render(
      <EditShopSocialInputs
        followerCount="10K"
        setFollowerCount={jest.fn()}
        instagram="cool_store"
        setInstagram={jest.fn()}
      />
    );

    const followerInput = screen.getByLabelText('تعداد دنبال‌کننده');
    const instagramInput = screen.getByLabelText('آیدی اینستاگرام');

    expect(followerInput).toHaveValue('10K');
    expect(instagramInput).toHaveValue('cool_store');
  });

  it('calls setFollowerCount when typing in the follower count input', async () => {
    const user = userEvent.setup();
    const handleSetFollower = jest.fn();

    render(
      <EditShopSocialInputs
        followerCount=""
        setFollowerCount={handleSetFollower}
        instagram=""
        setInstagram={jest.fn()}
      />
    );

    const followerInput = screen.getByLabelText('تعداد دنبال‌کننده');
    await user.type(followerInput, '500');

    expect(handleSetFollower).toHaveBeenCalled();
  });

  it('calls setInstagram and strips leading @ when changing value', () => {
    const handleSetInstagram = jest.fn();

    render(
      <EditShopSocialInputs
        followerCount=""
        setFollowerCount={jest.fn()}
        instagram=""
        setInstagram={handleSetInstagram}
      />
    );

    const instagramInput = screen.getByLabelText('آیدی اینستاگرام');
    fireEvent.change(instagramInput, { target: { value: '@new_handle' } });

    expect(handleSetInstagram).toHaveBeenCalledWith('new_handle');
  });

  it('applies theme variant classes by default', () => {
    render(
      <EditShopSocialInputs
        followerCount=""
        setFollowerCount={jest.fn()}
        instagram=""
        setInstagram={jest.fn()}
      />
    );

    const followerInput = screen.getByLabelText('تعداد دنبال‌کننده');
    expect(followerInput.className).toContain('bg-surface-variant');
  });

  it('applies neutral variant classes when variant is neutral', () => {
    render(
      <EditShopSocialInputs
        followerCount=""
        setFollowerCount={jest.fn()}
        instagram=""
        setInstagram={jest.fn()}
        variant="neutral"
      />
    );

    const followerInput = screen.getByLabelText('تعداد دنبال‌کننده');
    expect(followerInput.className).toContain('bg-zinc-50');
  });

  it('works with useFormContext when props are omitted', async () => {
    const user = userEvent.setup();

    function FormWrapper() {
      const methods = useForm<profileSchemaType>({
        defaultValues: {
          followerCount: '250',
          instagram: 'form_store',
        },
      });

      return (
        <FormProvider {...methods}>
          <EditShopSocialInputs />
        </FormProvider>
      );
    }

    render(<FormWrapper />);

    const followerInput = screen.getByLabelText('تعداد دنبال‌کننده');
    const instagramInput = screen.getByLabelText('آیدی اینستاگرام');

    expect(followerInput).toHaveValue('250');
    expect(instagramInput).toHaveValue('form_store');

    await user.clear(followerInput);
    await user.type(followerInput, '999');
    expect(followerInput).toHaveValue('999');
  });
});

import { Phone, Mail, Clock, MessageSquare } from 'lucide-react';
import Header from '@/components/layout/Header';
import { buttonVariants } from '@/components/ui/button';
import { text } from '../constants';

export function ContactView() {
  const contactMethods = [
    {
      id: 'phone',
      icon: <Phone className="size-5 text-primary" />,
      title: 'تماس تلفنی با پشتیبانی',
      value: '۰۲۱-۹۱۰۰۰۰۰۰',
      description: 'شنبه تا چهارشنبه از ساعت ۹ الی ۱۸',
    },
    {
      id: 'email',
      icon: <Mail className="size-5 text-primary" />,
      title: 'پست الکترونیک',
      value: 'support@inshop.ir',
      description: 'پاسخگویی حداکثر ظرف ۲۴ ساعت کاری',
    },
    {
      id: 'hours',
      icon: <Clock className="size-5 text-primary" />,
      title: 'ساعات کاری پشتیبانی',
      value: 'همه روزه (به جز ایام تعطیل)',
      description: '۹:۰۰ الی ۱۸:۰۰',
    },
  ];

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-background text-foreground select-none" dir="rtl">
      <Header.Root>
        <Header.Back id="contact-back-btn" />
        <Header.Title>{text.menu.items.contact.title}</Header.Title>
        <Header.Right />
      </Header.Root>

      <main className="hide-scrollbar flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-md space-y-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="size-16 rounded-3xl bg-surface-l1 flex items-center justify-center text-primary border border-primary/10 shadow-sm">
              <MessageSquare className="size-8" />
            </div>
            <h1 className="text-base font-extrabold text-primary">پشتیبانی و ارتباط با inShop</h1>
            <p className="text-xs text-secondary leading-relaxed px-4">
              {text.menu.items.contact.description}
            </p>
          </div>

          <div className="space-y-3">
            {contactMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-start gap-3.5 p-4 rounded-2xl border border-border bg-surface text-right"
              >
                <div className="size-10 rounded-xl bg-surface-l1 flex items-center justify-center shrink-0 border border-primary/10">
                  {method.icon}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-xs font-bold text-primary">{method.title}</span>
                  <span className="text-xs font-semibold text-foreground mt-0.5" dir="ltr">{method.value}</span>
                  <span className="text-[11px] text-secondary mt-1">{method.description}</span>
                </div>
              </div>
            ))}
          </div>

          <a
            id="btn-call-support"
            href="tel:02191000000"
            className={buttonVariants({
              variant: 'filled',
              size: 'xl',
              className: 'w-full flex items-center justify-center gap-2 font-bold',
            })}
          >
            <Phone className="size-4" />
            <span>تماس مستقیم با پشتیبانی</span>
          </a>
        </div>
      </main>
    </div>
  );
}

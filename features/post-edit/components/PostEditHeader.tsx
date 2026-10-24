import Header from '@/components/layout/Header';

export function PostEditHeader() {
  return (
    <Header.Root>
      <Header.Back id="post-edit-back-btn" />
      <Header.Title>ویرایش پست</Header.Title>
      <Header.Right />
    </Header.Root>
  );
}

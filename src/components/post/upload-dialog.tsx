
"use client";

import { useState, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/context/app-provider';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  caption: z.string().min(1, { message: 'Caption is required.' }).max(2200),
  image: z.instanceof(File).refine(file => file.size > 0, { message: 'Image is required.' }),
});

export function UploadDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { addPost, currentUser } = useApp();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caption: '',
      image: undefined,
    },
    mode: 'onChange',
  });

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to create a post.',
      });
      return;
    }

    if (!values.image) {
        form.setError('image', { type: 'manual', message: 'Image is required.' });
        return;
    }
    const imageUrl = await toBase64(values.image);
    addPost({
      user: { username: currentUser.username, avatarUrl: currentUser.avatarUrl },
      imageUrl,
      caption: values.caption,
    });
    form.reset();
    setPreview(null);
    setOpen(false);
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>, fieldOnChange: (value: File | undefined) => void) => {
    const file = event.target.files?.[0];
    if (file) {
      fieldOnChange(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
        fieldOnChange(undefined);
        setPreview(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        form.reset();
        setPreview(null);
      }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create new post</DialogTitle>
          <DialogDescription>
            Select a photo to share.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex w-full items-center justify-center">
                        <FormLabel htmlFor="image-upload" className="flex h-64 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed">
                          {preview ? (
                            <Image
                              src={preview}
                              alt="Image preview"
                              width={400}
                              height={400}
                              className="h-full w-full object-cover rounded-md"
                            />
                          ) : (
                            <div className="text-center text-sm text-muted-foreground">
                              Click to select image
                            </div>
                          )}
                        </FormLabel>
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageChange(e, field.onChange)}
                        />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="caption"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea placeholder="Write a caption..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isValid || !currentUser}>
                Share
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

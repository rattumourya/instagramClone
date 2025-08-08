
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

const MAX_IMAGE_SIZE_BYTES = 1024 * 1024; // 1MB

const formSchema = z.object({
  caption: z.string().min(1, { message: 'Caption is required.' }).max(2200),
  image: z.instanceof(File).refine(file => file.size > 0, { message: 'Image is required.' }),
});

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = error => reject(error);
});

const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<File> => {
    return new Promise((resolve, reject) => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
                if (!blob) {
                    return reject(new Error('Canvas to Blob conversion failed'));
                }
                const newFile = new File([blob], file.name, {
                    type: file.type,
                    lastModified: Date.now(),
                });
                URL.revokeObjectURL(img.src);
                resolve(newFile);
            }, file.type, 0.9); // 0.9 quality
        };
        img.onerror = (error) => {
            URL.revokeObjectURL(img.src);
            reject(error);
        };
    });
};


export function UploadDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { addPost, currentUser } = useApp();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caption: '',
      image: new File([], ""),
    },
    mode: 'onChange',
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

    try {
        const resizedImage = await resizeImage(values.image, 1080, 1080); // Instagram's standard resolution
        const imageUrl = await toBase64(resizedImage);
        
        if (imageUrl.length > MAX_IMAGE_SIZE_BYTES) {
            toast({
                variant: 'destructive',
                title: 'Image Too Large',
                description: 'The selected image is still too large after resizing. Please select a smaller file.',
            });
            return;
        }

        addPost({
            imageUrl,
            caption: values.caption,
        });
        form.reset();
        setPreview(null);
        setOpen(false);

    } catch (error) {
        console.error("Error processing image:", error);
        toast({
            variant: 'destructive',
            title: 'Error processing image',
            description: 'There was an error while trying to process your image. Please try again.',
        });
    }
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

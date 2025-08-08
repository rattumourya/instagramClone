
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
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
  } from "@/components/ui/carousel"
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/context/app-provider';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import type { Media } from '@/lib/types';
import { UploadCloud } from 'lucide-react';

const MAX_IMAGE_SIZE_BYTES = 1024 * 1024 * 5; // 5MB

const formSchema = z.object({
  caption: z.string().min(1, { message: 'Caption is required.' }).max(2200),
  files: z.array(z.instanceof(File)).min(1, 'Please select at least one file.'),
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
  const [previews, setPreviews] = useState<string[]>([]);
  const { addPost, currentUser } = useApp();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caption: '',
      files: [],
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

    try {
        const media: Media[] = await Promise.all(values.files.map(async (file) => {
            if (file.type.startsWith('image/')) {
                const resizedImage = await resizeImage(file, 1080, 1080);
                const url = await toBase64(resizedImage);
                if (url.length > MAX_IMAGE_SIZE_BYTES) {
                  throw new Error(`Image ${file.name} is too large after resizing.`);
                }
                return { url, type: 'image' as const };
            } else if (file.type.startsWith('video/')) {
                const url = await toBase64(file);
                 if (url.length > MAX_IMAGE_SIZE_BYTES) { // Add a reasonable size limit for videos too
                    throw new Error(`Video ${file.name} is too large.`);
                }
                return { url, type: 'video' as const };
            }
            throw new Error(`Unsupported file type: ${file.name}`);
        }));

        addPost({
            media,
            caption: values.caption,
        });
        form.reset();
        setPreviews([]);
        setOpen(false);

    } catch (error: any) {
        console.error("Error processing files:", error);
        toast({
            variant: 'destructive',
            title: 'Error processing files',
            description: error.message || 'There was an error while trying to process your files. Please try again.',
        });
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fieldOnChange: (value: File[]) => void) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      fieldOnChange(fileArray);
      
      const newPreviews = Array.from(files).map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
    } else {
        fieldOnChange([]);
        setPreviews([]);
    }
  };

  const resetDialog = () => {
    form.reset();
    setPreviews([]);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        resetDialog();
      }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create new post</DialogTitle>
          <DialogDescription>
            Select photos and videos to share.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="files"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex w-full items-center justify-center">
                        <FormLabel htmlFor="file-upload" className="flex h-64 w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed">
                          {previews.length > 0 ? (
                            <Carousel className="w-full h-full max-w-xs">
                                <CarouselContent>
                                    {previews.map((src, index) => (
                                        <CarouselItem key={index} className="flex items-center justify-center">
                                            {field.value[index]?.type.startsWith('image/') ? (
                                                <Image
                                                    src={src}
                                                    alt={`Preview ${index}`}
                                                    width={400}
                                                    height={400}
                                                    className="h-full w-full object-contain rounded-md"
                                                    onLoad={() => URL.revokeObjectURL(src)}
                                                />
                                            ) : (
                                                <video
                                                    src={src}
                                                    controls
                                                    className="h-full w-full object-contain rounded-md"
                                                    onCanPlay={() => URL.revokeObjectURL(src)}
                                                />
                                            )}
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                {previews.length > 1 && (
                                    <>
                                        <CarouselPrevious className='absolute left-2 top-1/2 -translate-y-1/2' />
                                        <CarouselNext className='absolute right-2 top-1/2 -translate-y-1/2' />
                                    </>
                                )}
                            </Carousel>
                          ) : (
                            <div className="text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                              <UploadCloud className='w-10 h-10' />
                              Click to select photos and videos
                            </div>
                          )}
                        </FormLabel>
                        <Input
                          id="file-upload"
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleFileChange(e, field.onChange)}
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

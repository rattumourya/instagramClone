
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

const formSchema = z.object({
  caption: z.string().min(1, { message: 'Caption is required.' }).max(2200),
  files: z.array(z.instanceof(File)).min(1, 'Please select at least one file.'),
});

// For local dev, we will use Object URLs to display media without a real backend.
const getLocalMediaUrl = (file: File): string => {
  return URL.createObjectURL(file);
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
        // Since this is local, we just use the Object URLs we already created for previews.
        const media: Media[] = values.files.map((file) => {
            const url = getLocalMediaUrl(file);
            return { url, type: file.type.startsWith('image/') ? 'image' as const : 'video' as const };
        });

        await addPost({
            media,
            caption: values.caption,
        });
        
        // Don't revoke URLs here, they are needed for display in the feed.
        // They will be lost on page refresh anyway, which is expected for this local-only setup.
        
        resetDialog();
        setOpen(false);

    } catch (error: any) {
        console.error("Error processing files:", error);
        toast({
            variant: 'destructive',
            title: 'Error creating post',
            description: error.message || 'There was an error while trying to create your post. Please try again.',
        });
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fieldOnChange: (value: File[]) => void) => {
    // Revoke old previews before creating new ones
    previews.forEach(preview => URL.revokeObjectURL(preview));
    
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
            Select photos and videos to share. These will be lost on refresh.
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
                                        <CarouselItem key={index} className="flex items-center justify-center h-full">
                                            {field.value[index]?.type.startsWith('image/') ? (
                                                <Image
                                                    src={src}
                                                    alt={`Preview ${index}`}
                                                    width={400}
                                                    height={400}
                                                    className="h-full w-full object-contain rounded-md"
                                                />
                                            ) : (
                                                <video
                                                    src={src}
                                                    controls
                                                    className="h-full w-full object-contain rounded-md"
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
                {form.formState.isSubmitting ? 'Sharing...' : 'Share'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

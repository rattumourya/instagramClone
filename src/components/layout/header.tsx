"use client";

import Link from 'next/link';
import { Camera, Home, PlusSquare, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadDialog } from '@/components/post/upload-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useRouter } from 'next/navigation';

export function Header() {
    const router = useRouter();
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card">
      <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Camera className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-primary font-headline">Focusgram</h1>
        </Link>

        <div className="relative hidden w-full max-w-xs items-center sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search" className="pl-9" />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <Home className="h-6 w-6" />
              <span className="sr-only">Home</span>
            </Link>
          </Button>
          
          <UploadDialog>
            <Button variant="ghost" size="icon">
              <PlusSquare className="h-6 w-6" />
              <span className="sr-only">New Post</span>
            </Button>
          </UploadDialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className='rounded-full'>
                    <Avatar className='h-8 w-8'>
                        <AvatarImage src='https://placehold.co/150x150.png' alt='@mona_lisa' />
                        <AvatarFallback>ML</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/mona_lisa')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/login')}>
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </header>
  );
}

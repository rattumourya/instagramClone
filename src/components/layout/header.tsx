
"use client";

import Link from 'next/link';
import { Camera, Home, PlusSquare, Search, User, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadDialog } from '@/components/post/upload-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useApp } from '@/context/app-provider';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import type { User as UserType } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Skeleton } from '../ui/skeleton';

const SearchResults = ({ users, onResultClick }: { users: UserType[], onResultClick: () => void }) => (
    <div className='divide-y max-h-80 overflow-y-auto'>
        {users.length > 0 ? users.map(user => (
            <Link key={user.id} href={`/${user.username}`} onClick={onResultClick} className="flex items-center gap-4 p-3 hover:bg-accent transition-colors">
                <Avatar className='h-11 w-11'>
                    <AvatarImage src={user.avatarUrl} alt={user.username} data-ai-hint="avatar" />
                    <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className='text-sm'>
                    <div className='font-bold'>{user.username}</div>
                    <div className='text-muted-foreground'>{user.name}</div>
                </div>
            </Link>
        )) : (
            <div className='p-4 text-center text-sm text-muted-foreground'>No results found.</div>
        )}
    </div>
);


export function Header() {
    const router = useRouter();
    const { currentUser, signOut, users, loading: appLoading } = useApp();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const clearSearch = () => {
        setSearchQuery('');
    };

    const handleResultClick = () => {
        setIsSearchFocused(false);
        setSearchQuery('');
    };
    
    const filteredUsers = useMemo(() => {
        if (!searchQuery) return [];
        return users.filter(user => 
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, users]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card">
      <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Camera className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold tracking-tight text-primary">Focusgram</h1>
        </Link>

        <div className="relative hidden w-full max-w-xs items-center sm:block">
            { appLoading ? (
                <Skeleton className='h-10 w-full' />
            ) : (
                <Popover open={isSearchFocused && searchQuery.length > 0} onOpenChange={setIsSearchFocused}>
                    <PopoverTrigger asChild>
                        <div className='relative w-full'>
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input 
                                placeholder="Search" 
                                className="pl-9"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onFocus={() => setIsSearchFocused(true)}
                            />
                            {searchQuery && (
                                <Button variant="ghost" size="icon" className='h-7 w-7 absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full' onClick={clearSearch}>
                                    <X className='h-4 w-4 text-muted-foreground'/>
                                </Button>
                            )}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0' onOpenAutoFocus={(e) => e.preventDefault()}>
                        <SearchResults users={filteredUsers} onResultClick={handleResultClick} />
                    </PopoverContent>
                </Popover>
            )}
        </div>

        <div className="flex items-center gap-2">
          { currentUser ? (
            <>
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
                            <AvatarImage src={currentUser.avatarUrl} alt={`@${currentUser.username}`} data-ai-hint="avatar" />
                            <AvatarFallback>{currentUser.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push(`/${currentUser.username}`)}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
             !appLoading && <Button onClick={() => router.push('/login')}>Log In</Button>
          )}
        </div>
      </div>
    </header>
  );
}

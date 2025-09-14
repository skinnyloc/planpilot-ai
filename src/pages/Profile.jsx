import React, { useState, useEffect } from 'react';
import { User as UserEntity } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from "sonner";

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [originalUser, setOriginalUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            setIsLoading(true);
            try {
                const currentUser = await UserEntity.me();
                const userData = {
                    email: currentUser.email,
                    username: currentUser.username || '',
                    first_name: currentUser.first_name || '',
                    last_name: currentUser.last_name || '',
                };
                setUser(userData);
                setOriginalUser(userData);
            } catch (error) {
                toast.error("Failed to load user profile.");
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Construct the full_name if first_name or last_name are provided
            const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || originalUser.full_name;
            
            await UserEntity.updateMyUserData({ 
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                full_name: fullName // Also update the built-in full_name
            });
            setOriginalUser(user); // Update original state to reflect saved changes
            toast.success("Profile saved successfully!");
        } catch (error) {
            toast.error("Failed to save profile.");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleClear = () => {
        setUser(originalUser);
        toast.info("Changes have been cleared.");
    };
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-navy-800">My Profile</h1>
            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Edit Your Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" value={user?.email || ''} disabled className="bg-slate-100" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" name="username" value={user?.username || ''} onChange={handleChange} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">First Name</Label>
                            <Input id="first_name" name="first_name" value={user?.first_name || ''} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Last Name</Label>
                            <Input id="last_name" name="last_name" value={user?.last_name || ''} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Button 
                            onClick={handleSave} 
                            disabled={isSaving}
                            style={{ backgroundColor: '#000000', color: '#FFD000', borderRadius: '12px' }}
                        >
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={handleClear}
                            style={{
                                borderColor: '#000000',
                                borderWidth: '2px',
                                color: '#000000',
                                borderRadius: '12px'
                            }}
                        >
                            Clear
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
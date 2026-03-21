"use client"
import { useRef, useState } from 'react';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { ChevronLeft, Dog, ClipboardList } from 'lucide-react';
import { useToast } from '@/app/context/ToastContext';

const MOCK_PROFILE = {
    name: "Dawg",
    species: "Dog",
    breed: "Poodle",
    age: "3",
    size: "Medium",
    triggers: "Loud noises (thunder, fireworks), unfamiliar large dogs",
    dietaryNeeds: "Allergic to chicken. Requires grain-free kibble twice a day.",
    careNotes: "Needs a 30-minute walk every evening. Friendly but shy at first."
};

export default function PetProfile() {
    const [petData, setPetData] = useState(MOCK_PROFILE);

    const {fireToast} = useToast();

    const handleSave = () => {
        fireToast("success","Profile Updated","Changes saved to the Behavioral Blueprint.");
    }

    // INVISIBLE INPUT FILE ELEMENT
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            console.log("Selected file:", file.name);
            // Here is where you'd handle the upload or preview logic
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <Navbar />

            <main className="max-w-4xl mx-auto px-6 py-10">
                <div className="mb-6">
                    <Link href="/owner/my_pets" className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1 mb-4">
                        <ChevronLeft size={16} /> Back to My Pets
                    </Link>
                    <div className="flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">{petData.name}'s Profile</h1>
                            <p className="text-gray-500 mt-1">Manage behavioral blueprint and care instructions</p>
                        </div>
                        <button onClick={()=>handleSave()} className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors shadow-sm">
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* HIDDEN FILE INPUT */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoChange}
                    accept="image/*" // Restricts picker to images
                    className="hidden" 
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                            <div className="w-32 h-32 mx-auto bg-teal-50 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                                <Dog size={48} className="text-teal-500" />
                            </div>
                            <button 
                                onClick={triggerFileSelect}
                                className="text-teal-600 hover:text-teal-700 text-sm font-medium border border-teal-100 bg-teal-50 py-2 px-4 rounded-lg w-full transition-colors active:scale-95"
                            >
                                Change Photo
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                            <h3 className="font-bold text-gray-800 border-b border-gray-50 pb-2">Basic Details</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                                <input type="text" defaultValue={petData.name} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Breed</label>
                                <input type="text" defaultValue={petData.breed} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Age</label>
                                    <input type="number" defaultValue={petData.age} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Size</label>
                                    <select defaultValue={petData.size} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500">
                                        <option>Small</option>
                                        <option>Medium</option>
                                        <option>Large</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-teal-600">
                                    <ClipboardList size={24} />
                                </span>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Behavioral Blueprint</h2>
                                    <p className="text-sm text-gray-500">This information helps match you with the right caregiver.</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Behavioral Triggers</label>
                                    <p className="text-sm text-gray-500 mb-2">What makes your pet anxious, scared, or aggressive?</p>
                                    <textarea 
                                        defaultValue={petData.triggers} 
                                        rows={3} 
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 resize-none" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Dietary Needs & Allergies</label>
                                    <p className="text-sm text-gray-500 mb-2">List any food sensitivities and feeding schedules.</p>
                                    <textarea 
                                        defaultValue={petData.dietaryNeeds} 
                                        rows={3} 
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 resize-none" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">General Care Notes</label>
                                    <p className="text-sm text-gray-500 mb-2">Routines, medication instructions, or favorite toys.</p>
                                    <textarea 
                                        defaultValue={petData.careNotes} 
                                        rows={4} 
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 resize-none" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
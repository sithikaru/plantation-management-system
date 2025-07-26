'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Leaf, Camera, Save, ArrowLeft, RefreshCw, Upload } from "lucide-react";
import { lotAPI } from '@/lib/api';

interface PlantSpecies {
  _id: string;
  name: string;
  code: string;
  category: string;
  minHeight: number;
  harvestDays: number;
}

interface PlantLot {
  _id: string;
  lotId: string;
  speciesId: PlantSpecies;
  plantedDate: string;
  zone: string;
  locationId: string;
  currentHeight: number;
  diameter: number;
  healthStatus: 'healthy' | 'sick' | 'recovering' | 'dead';
  photos: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateData {
  currentHeight: number;
  diameter: number;
  healthStatus: 'healthy' | 'sick' | 'recovering' | 'dead';
  photos: string[];
  notes: string;
}

export default function UpdateLotPage() {
  const params = useParams();
  const router = useRouter();
  const lotId = params.lotId as string;

  const [lot, setLot] = useState<PlantLot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [currentHeight, setCurrentHeight] = useState<number>(0);
  const [diameter, setDiameter] = useState<number>(0);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'sick' | 'recovering' | 'dead'>('healthy');
  const [notes, setNotes] = useState<string>('');
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  // Fetch lot data on component mount
  useEffect(() => {
    if (lotId) {
      fetchLot();
    }
  }, [lotId]);

  const fetchLot = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await lotAPI.getLot(lotId);
      
      if (response.success) {
        const lotData = response.data;
        setLot(lotData);
        
        // Initialize form with current values
        setCurrentHeight(lotData.currentHeight || 0);
        setDiameter(lotData.diameter || 0);
        setHealthStatus(lotData.healthStatus || 'healthy');
        setNotes(lotData.notes || '');
      } else {
        setError(response.message || 'Failed to fetch lot data');
      }
    } catch (err: any) {
      console.error('Error fetching lot:', err);
      if (err.response?.status === 404) {
        setError('Plant lot not found');
      } else if (err.response?.status === 401) {
        setError('Authentication required. Please log in.');
        router.push('/login');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to fetch lot data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle photo selection
  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Limit to 5 photos max
    const limitedFiles = files.slice(0, 5);
    setNewPhotos(limitedFiles);

    // Create preview URLs
    const previews = limitedFiles.map(file => URL.createObjectURL(file));
    setPhotoPreview(previews);
  };

  // Upload photos to a simple storage solution (for demo, we'll use base64)
  const uploadPhotos = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const file of files) {
      try {
        // For demo purposes, convert to base64
        // In production, you'd upload to a cloud storage service
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        
        uploadedUrls.push(base64);
      } catch (error) {
        console.error('Error converting photo:', error);
      }
    }
    
    return uploadedUrls;
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!lot) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Upload photos if any
      let photoUrls: string[] = [];
      if (newPhotos.length > 0) {
        photoUrls = await uploadPhotos(newPhotos);
      }

      // Prepare update data
      const updateData: UpdateData = {
        currentHeight: Number(currentHeight),
        diameter: Number(diameter),
        healthStatus,
        photos: photoUrls,
        notes
      };

      const response = await lotAPI.updateLot(lot._id, updateData);
      
      if (response.success) {
        setSuccess('Lot updated successfully!');
        
        // Reset photo state
        setNewPhotos([]);
        setPhotoPreview([]);
        
        // Refresh lot data
        await fetchLot();
        
        // Auto-clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(response.message || 'Failed to update lot');
      }
    } catch (err: any) {
      console.error('Error updating lot:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update lot');
    } finally {
      setSaving(false);
    }
  };

  // Calculate days from planting
  const getDaysFromPlanting = (plantedDate: string) => {
    const planted = new Date(plantedDate);
    return Math.floor((Date.now() - planted.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Check if ready for harvest
  const isReadyForHarvest = (lot: PlantLot): boolean => {
    const daysFromPlanting = getDaysFromPlanting(lot.plantedDate);
    return daysFromPlanting >= lot.speciesId.harvestDays && lot.currentHeight >= lot.speciesId.minHeight;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get health status badge variant
  const getHealthBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'sick': return 'destructive';
      case 'recovering': return 'secondary';
      case 'dead': return 'outline';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
          <span className="text-lg">Loading lot data...</span>
        </div>
      </div>
    );
  }

  if (error && !lot) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={fetchLot}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-green-950/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Leaf className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold text-green-800 dark:text-green-100">
                Update Plant Lot
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {lot && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Lot Information Card */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5" />
                  Lot Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Lot ID</Label>
                  <p className="text-lg font-semibold">{lot.lotId}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Species</Label>
                  <p className="font-medium">{lot.speciesId.name}</p>
                  <p className="text-sm text-gray-500">{lot.speciesId.code}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Location</Label>
                  <p>{lot.zone} - {lot.locationId}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Planted Date</Label>
                  <p>{formatDate(lot.plantedDate)}</p>
                  <p className="text-sm text-gray-500">
                    {getDaysFromPlanting(lot.plantedDate)} days ago
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Harvest Target</Label>
                  <p className="text-sm">
                    {lot.speciesId.harvestDays} days, {lot.speciesId.minHeight} cm minimum
                  </p>
                  <Badge variant={isReadyForHarvest(lot) ? "default" : "secondary"}>
                    {isReadyForHarvest(lot) ? "Ready for Harvest" : "Still Growing"}
                  </Badge>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-600">Current Status</Label>
                  <Badge variant={getHealthBadgeVariant(lot.healthStatus)}>
                    {lot.healthStatus}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Update Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Update Measurements & Status</CardTitle>
                <CardDescription>
                  Record the latest measurements and health observations for this plant lot
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Success/Error Messages */}
                {success && (
                  <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                    {success}
                  </div>
                )}
                {error && (
                  <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Measurements */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="height">Current Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        min="0"
                        step="0.1"
                        value={currentHeight}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentHeight(Number(e.target.value))}
                        placeholder="Enter height in cm"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Previous: {lot.currentHeight} cm
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="diameter">Diameter (cm)</Label>
                      <Input
                        id="diameter"
                        type="number"
                        min="0"
                        step="0.1"
                        value={diameter}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiameter(Number(e.target.value))}
                        placeholder="Enter diameter in cm"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Previous: {lot.diameter} cm
                      </p>
                    </div>
                  </div>

                  {/* Health Status */}
                  <div className="space-y-2">
                    <Label htmlFor="health">Health Status</Label>
                    <Select value={healthStatus} onValueChange={(value: 'healthy' | 'sick' | 'recovering' | 'dead') => setHealthStatus(value)}>
                      <SelectTrigger id="health">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="healthy">Healthy</SelectItem>
                        <SelectItem value="sick">Sick</SelectItem>
                        <SelectItem value="recovering">Recovering</SelectItem>
                        <SelectItem value="dead">Dead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Photo Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="photos">Add Photos</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="photos"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                      />
                      <Camera className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500">
                      Select up to 5 photos. Accepted formats: JPG, PNG, GIF
                    </p>
                    
                    {/* Photo Previews */}
                    {photoPreview.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {photoPreview.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Observation Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                      placeholder="Record any observations about the plant's condition, growth, or other notes..."
                      rows={4}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="flex-1"
                    >
                      {saving ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Update Lot
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={fetchLot}
                      disabled={saving}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

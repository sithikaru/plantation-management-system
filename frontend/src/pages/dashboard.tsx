import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Leaf, Search, Filter, RefreshCw, Eye, QrCode, LogOut } from "lucide-react";
import { lotAPI } from '@/utils/api';

interface PlantSpecies {
  _id: string;
  name: string;
  code: string;
  category: string;
  minHeight: number;
  maxHeight: number;
  averageLifespan: number;
  soilRequirements: string;
  climateRequirements: string;
  description?: string;
}

interface PlantLot {
  _id: string;
  lotId: string;
  speciesId: PlantSpecies;
  plantedDate: string;
  zone: string;
  locationId: string;
  currentHeight?: number;
  diameter?: number;
  healthStatus: 'healthy' | 'diseased' | 'pest_infected' | 'drought_stressed';
  createdAt: string;
  updatedAt: string;
}

type ReadinessFilter = 'all' | 'ready' | 'not-ready';
type HealthFilter = 'all' | 'healthy' | 'diseased' | 'pest_infected' | 'drought_stressed';

export default function Dashboard() {
  const router = useRouter();
  const [lots, setLots] = useState<PlantLot[]>([]);
  const [filteredLots, setFilteredLots] = useState<PlantLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>('all');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [user, setUser] = useState<any>(null);

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      router.push('/login');
      return;
    }
    
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Fetch plant lots from backend
  const fetchLots = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const data = await lotAPI.getLots({
        page,
        limit: 10
      });

      if (data.success) {
        setLots(data.data);
        setCurrentPage(data.pagination?.page || 1);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        throw new Error(data.message || 'Failed to fetch plant lots');
      }
    } catch (err: any) {
      console.error('Error fetching lots:', err);
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in.');
        localStorage.removeItem('token');
      } else {
        setError(err.message || err.response?.data?.message || 'Failed to fetch plant lots');
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if a lot is ready for harvest
  const isReadyForHarvest = (lot: PlantLot): boolean => {
    const plantedDate = new Date(lot.plantedDate);
    const daysFromPlanting = Math.floor((Date.now() - plantedDate.getTime()) / (1000 * 60 * 60 * 24));
    const minimumDays = 90; // Default minimum days for harvest
    return daysFromPlanting >= minimumDays && (lot.currentHeight || 0) >= lot.speciesId.minHeight;
  };

  // Filter lots based on search term and filters
  useEffect(() => {
    let filtered = lots.filter(lot => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        lot.lotId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.speciesId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lot.locationId.toLowerCase().includes(searchTerm.toLowerCase());

      // Readiness filter
      const isReady = isReadyForHarvest(lot);
      const matchesReadiness = readinessFilter === 'all' ||
        (readinessFilter === 'ready' && isReady) ||
        (readinessFilter === 'not-ready' && !isReady);

      // Health filter
      const matchesHealth = healthFilter === 'all' || lot.healthStatus === healthFilter;

      return matchesSearch && matchesReadiness && matchesHealth;
    });

    setFilteredLots(filtered);
  }, [lots, searchTerm, readinessFilter, healthFilter]);

  // Load lots on component mount
  useEffect(() => {
    fetchLots();
  }, []);

  // Get badge variant for health status
  const getHealthBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'diseased': return 'destructive';
      case 'pest_infected': return 'destructive';
      case 'drought_stressed': return 'secondary';
      default: return 'secondary';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate days from planting
  const getDaysFromPlanting = (plantedDate: string) => {
    const planted = new Date(plantedDate);
    return Math.floor((Date.now() - planted.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-green-950/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold text-green-800 dark:text-green-100">
                Plant Lots Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {user && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Welcome, {user.name}
                </span>
              )}
              <Button 
                onClick={() => fetchLots(currentPage)} 
                variant="outline" 
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                onClick={handleLogout}
                variant="outline" 
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
            <CardDescription>
              Search and filter plant lots by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              {/* Search Input */}
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by lot ID, species, zone, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Readiness Filter */}
              <div className="min-w-[200px]">
                <label className="text-sm font-medium mb-2 block">Harvest Readiness</label>
                <Select value={readinessFilter} onValueChange={(value: ReadinessFilter) => setReadinessFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Lots</SelectItem>
                    <SelectItem value="ready">Ready for Harvest</SelectItem>
                    <SelectItem value="not-ready">Not Ready</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Health Filter */}
              <div className="min-w-[150px]">
                <label className="text-sm font-medium mb-2 block">Health Status</label>
                <Select value={healthFilter} onValueChange={(value: HealthFilter) => setHealthFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="diseased">Diseased</SelectItem>
                    <SelectItem value="pest_infected">Pest Infected</SelectItem>
                    <SelectItem value="drought_stressed">Drought Stressed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredLots.length} of {lots.length} plant lots
          </p>
          {error && (
            <div className="text-red-600 text-sm">
              Error: {error}
            </div>
          )}
        </div>

        {/* Plant Lots Table */}
        <Card>
          <CardHeader>
            <CardTitle>Plant Lots</CardTitle>
            <CardDescription>
              Complete overview of all plant lots in your plantation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-green-600" />
                <span className="ml-2">Loading plant lots...</span>
              </div>
            ) : filteredLots.length === 0 ? (
              <div className="text-center py-8">
                <Leaf className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {lots.length === 0 ? 'No plant lots found' : 'No lots match your search criteria'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lot ID</TableHead>
                    <TableHead>Species</TableHead>
                    <TableHead>Zone/Location</TableHead>
                    <TableHead>Planted Date</TableHead>
                    <TableHead>Days Growing</TableHead>
                    <TableHead>Height (cm)</TableHead>
                    <TableHead>Health</TableHead>
                    <TableHead>Harvest Ready</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLots.map((lot) => {
                    const isReady = isReadyForHarvest(lot);
                    const daysGrowing = getDaysFromPlanting(lot.plantedDate);
                    
                    return (
                      <TableRow key={lot._id}>
                        <TableCell className="font-medium">{lot.lotId}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{lot.speciesId.name}</div>
                            <div className="text-sm text-gray-500">{lot.speciesId.code}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{lot.zone}</div>
                            <div className="text-sm text-gray-500">{lot.locationId}</div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(lot.plantedDate)}</TableCell>
                        <TableCell>
                          <div>
                            <div>{daysGrowing} days</div>
                            <div className="text-sm text-gray-500">
                              Target: 90+ days
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{lot.currentHeight} cm</div>
                            <div className="text-sm text-gray-500">
                              Min: {lot.speciesId.minHeight} cm
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getHealthBadgeVariant(lot.healthStatus)}>
                            {lot.healthStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isReady ? "default" : "secondary"}>
                            {isReady ? "Ready" : "Growing"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => fetchLots(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => fetchLots(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

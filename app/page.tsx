import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Home, 
  CheckCircle, 
  Clock, 
  Users, 
  Award, 
  Star, 
  BookOpen,
  Shield,
  BarChart3,
  GraduationCap,
  Calendar,
  User,
  Plus,
  ArrowRight,
  Instagram,
  Mail,
  Phone,
  MapPin,
  Building
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-primary">Shalean</div>
              <span className="text-sm text-gray-500">Cleaning Services</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/services" className="text-gray-700 hover:text-primary">Services</Link>
              <Link href="/about" className="text-gray-700 hover:text-primary">About</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-primary">Pricing</Link>
              <Link href="/contact" className="text-gray-700 hover:text-primary">Contact</Link>
              <Link href="/login" className="text-gray-700 hover:text-primary">Login</Link>
              <Link href="/booking">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  Get Started
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
            <div className="mb-4">
              <Badge className="bg-primary/10 text-primary border-primary/20">
                Professional Cleaning Excellence
              </Badge>
            </div>
            <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-7xl">
              Transform Your
              <br />
              <span className="text-primary">Living Space</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Experience the ultimate in professional cleaning services. Expert cleaners, 
              eco-friendly products, and guaranteed satisfaction for your home or office.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/booking">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg">
                  Book Cleaning Service
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10 px-8 py-4 text-lg">
                View Services
              </Button>
            </div>
          </div>
          
          {/* Key Statistics */}
          <div className="mt-20 grid grid-cols-2 gap-6 md:grid-cols-4">
            <Card className="text-center p-6 border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="mb-4 mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="text-3xl font-bold text-gray-900">2,500+</div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </CardContent>
            </Card>
            <Card className="text-center p-6 border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="mb-4 mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div className="text-3xl font-bold text-gray-900">98%</div>
                <div className="text-sm text-gray-600">Satisfaction Rate</div>
              </CardContent>
            </Card>
            <Card className="text-center p-6 border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="mb-4 mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div className="text-3xl font-bold text-gray-900">50+</div>
                <div className="text-sm text-gray-600">Expert Cleaners</div>
              </CardContent>
            </Card>
            <Card className="text-center p-6 border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="mb-4 mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div className="text-3xl font-bold text-gray-900">5000+</div>
                <div className="text-sm text-gray-600">Cleanings Done</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Flagship Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
                Premium Services
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Experience Our Premium Cleaning Services
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Comprehensive cleaning solutions designed to transform your space 
                from ordinary to extraordinary through meticulous attention to detail.
              </p>
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Deep Cleaning Sessions</h3>
                    <p className="text-gray-600">Watch our experts tackle every corner and surface.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Personalized Service Plans</h3>
                    <p className="text-gray-600">Receive customized cleaning schedules for lasting cleanliness.</p>
                  </div>
                </div>
              </div>
              <Link href="/services">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  Explore All Services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div>
              <div className="relative">
                <div className="rounded-lg overflow-hidden h-96 bg-gray-100">
                  <Image
                    src="/images/professional-cleaning-team.jpg"
                    alt="Professional cleaning team working in a modern kitchen"
                    width={800}
                    height={600}
                    className="w-full h-full object-cover"
                    priority
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  />
                </div>
                <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg p-4 shadow-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">100+ Hours</div>
                      <div className="text-sm text-gray-600">of Cleaning Experience</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">24/7</div>
                      <div className="text-sm text-gray-600">Customer Support</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
              Why Choose Shalean
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Everything You Need for a Spotless Home
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              From residential to commercial spaces, we provide comprehensive cleaning 
              solutions and tools for every type of property.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="mb-6 mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Expert-Led Services</h3>
                <p className="text-gray-600">
                  Learn from industry professionals with decades of cleaning experience and training.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="mb-6 mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Eco-Friendly Products</h3>
                <p className="text-gray-600">
                  Leverage cutting-edge green technology to enhance your living environment.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="mb-6 mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Insured & Bonded</h3>
                <p className="text-gray-600">
                  Master the art of protecting your property with our comprehensive insurance coverage.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-0">
                <div className="mb-6 mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Quality Guarantee</h3>
                <p className="text-gray-600">
                  Get satisfaction guarantee and quality assurance with every service.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Service Offerings Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
              Our Services
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Choose Your Cleaning Solution
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Explore our comprehensive range of professional cleaning services and solutions.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-gray-200 h-48 flex items-center justify-center">
                <div className="text-center">
                  <Home className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Residential Cleaning</p>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Residential Cleaning</h3>
                <p className="text-gray-600 mb-6">
                  Comprehensive home cleaning services available for regular maintenance and special occasions.
                </p>
                <Link href="/residential">
                  <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-gray-200 h-48 flex items-center justify-center">
                <div className="text-center">
                  <Building className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Commercial Cleaning</p>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Commercial Cleaning</h3>
                <p className="text-gray-600 mb-6">
                  Professional office and commercial space cleaning for all business types and sizes.
                </p>
                <Link href="/commercial">
                  <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-gray-200 h-48 flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Special Services</p>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Special Services</h3>
                <p className="text-gray-600 mb-6">
                  Move-in/out cleaning, post-construction cleanup, and specialized cleaning services.
                </p>
                <Link href="/special">
                  <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
              Meet Our Team
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Learn From Cleaning Experts
            </h2>
            <p className="text-lg text-gray-600">
              Our services are designed and delivered by our experienced leadership team.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
                <Badge className="mb-2">MANAGER</Badge>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Sarah Johnson</h3>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">@</span>
                  </div>
                  <span className="text-sm text-gray-600">@sarahjohnson</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1 mb-6">
                  <p>• 8+ years of cleaning experience</p>
                  <p>• Managed 5,000+ cleaning projects</p>
                  <p>• Certified in eco-friendly practices</p>
                </div>
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Follow Sarah
                </Button>
              </CardContent>
            </Card>
            <Card className="text-center p-6 border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
                <Badge className="mb-2">SUPERVISOR</Badge>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Mike Chen</h3>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">@</span>
                  </div>
                  <span className="text-sm text-gray-600">@mikechen</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1 mb-6">
                  <p>• 6+ years of commercial cleaning</p>
                  <p>• Trained 200+ cleaning specialists</p>
                  <p>• Quality assurance expert</p>
                </div>
                <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Follow Mike
                </Button>
              </CardContent>
            </Card>
            <Card className="text-center p-6 border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
                <Badge className="mb-2">TRAINER</Badge>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Emma Rodriguez</h3>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">@</span>
                  </div>
                  <span className="text-sm text-gray-600">@emmarodriguez</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1 mb-6">
                  <p>• 10+ years of residential expertise</p>
                  <p>• Developed cleaning protocols</p>
                  <p>• Customer satisfaction champion</p>
                </div>
                <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Follow Emma
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* As Featured In Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">As Featured In</h2>
            <p className="text-lg text-gray-600">
              Leading publications have recognized our commitment to excellence.
            </p>
          </div>
          <div className="flex justify-center items-center gap-12 opacity-60">
            <div className="text-2xl font-bold text-gray-400">CLEANING TIMES</div>
            <div className="text-2xl font-bold text-gray-400">HOME MAGAZINE</div>
            <div className="text-2xl font-bold text-gray-400">BUSINESS WEEKLY</div>
            <div className="text-2xl font-bold text-gray-400">LOCAL NEWS</div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Experience Spotless Living?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of satisfied customers who have transformed their spaces with Shalean Cleaning.
          </p>
          <Link href="/booking">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg">
              View All Services
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-xl font-bold">Shalean Cleaning</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Professional cleaning services and solutions helping homeowners and businesses 
                maintain pristine, healthy environments.
              </p>
            </div>
            <div className="flex flex-wrap gap-8">
              <div>
                <h3 className="font-semibold mb-4">Legal</h3>
                <div className="space-y-2">
                  <Link href="/terms" className="block text-gray-400 hover:text-white">Terms & Conditions</Link>
                  <Link href="/privacy" className="block text-gray-400 hover:text-white">Privacy Policy</Link>
                  <Link href="/cancellation" className="block text-gray-400 hover:text-white">Cancellation Policy</Link>
                  <Link href="/contact" className="block text-gray-400 hover:text-white">Contact Us</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Shalean Cleaning. All rights reserved.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Instagram className="h-5 w-5" />
              </div>
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Mail className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


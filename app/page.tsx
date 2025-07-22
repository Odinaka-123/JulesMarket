"use client"

import { Phone, Mail, MapPin, CheckCircle, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function JulesMarketWebsite() {
  const productCategories = [
    {
      name: "Vegetables",
      items: "Tomato, Cabbage, Pepper, Onion",
      image: "/images/pepper.png",
    },
    {
      name: "Tubers",
      items: "Yam, Potato",
      image: "/images/yam.jpg",
    },
    {
      name: "Meats",
      items: "Cow, Goat, Snail, Pig",
      image: "/images/meat.jpg",
    },
    {
      name: "Fruits",
      items: "Orange, Pineapple, Grape, Apple",
      image: "/images/apples.jpg",
    },
    {
      name: "Seafood",
      items: "Shrimps, Croaker, Titus, Red Snapper",
      image: "/images/periwinkle.jpg",
    },
    {
      name: "Grains",
      items: "Rice, Beans, Fiofio",
      image: "/images/beans.png",
    },
    {
      name: "Processed Foods",
      items: "Semolina, Soy Oil, Crayfish, Palm Oil",
      image: "/images/palm-fruits.jpg",
    },
  ]

  const howItWorks = [
    { step: "1", title: "Bulk Order via Group", description: "Join our WhatsApp group for bulk orders" },
    { step: "2", title: "Price Posted", description: "We share prices and available products" },
    { step: "3", title: "Payment Confirms Slot", description: "Secure your order with payment" },
    { step: "4", title: "Delivery/Pickup", description: "Get your fresh produce delivered or pick up" },
  ]

  const whyChooseUs = [
    { icon: "🚜", title: "Farm-Direct Food", description: "Fresh produce at fair prices" },
    { icon: "👥", title: "Group Buying", description: "Buy in groups and split bulk orders" },
    { icon: "⭐", title: "Trusted Service", description: "Trusted by households and restaurants" },
    { icon: "⚡", title: "Timely Delivery", description: "Friendly and reliable service" },
  ]

  const terms = [
    "Respectful communication required",
    "Payment confirms your order",
    "No price negotiation",
    "Delivery charges apply",
    "No food exchange after slots are locked",
    "Custom orders via DM only",
    "Late booking moves to next schedule",
  ]

  const scrollToFooter = () => {
    const footer = document.getElementById("footer")
    if (footer) {
      footer.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="min-h-screen bg-white" style={{ scrollBehavior: "smooth" }}>
      {/* WhatsApp Floating Button */}
      <Link
        href="https://wa.link/4sc980"
        className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle className="h-6 w-6" />
      </Link>

      {/* Header */}
      <header className="bg-green-700 text-white py-4 px-4 sticky top-0 z-40">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold italic">JULESMARKET</h1>
          <div className="flex gap-4">
            <button onClick={scrollToFooter} className="hover:text-yellow-300 transition-colors cursor-pointer">
              <Mail className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 to-green-800 text-white py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Pay Less. Eat Fresh. Stock Smarter.</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto">
            Fresh farm produce, meats, and foodstuff delivered or picked up — join our bulk shopping group today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-4 text-lg rounded-full"
            >
              <Link href="https://wa.link/4sc980" target="_blank" rel="noopener noreferrer">
                Join Now on WhatsApp
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-green-700 px-8 py-4 text-lg rounded-full bg-transparent"
            >
              <Link href="tel:08086674607">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-green-800">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productCategories.map((category, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow duration-300 border-green-200 overflow-hidden"
              >
                <CardContent className="p-0">
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={category.image || "/placeholder.svg"}
                      alt={category.name}
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 hover:bg-opacity-10 transition-all duration-300"></div>
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-semibold mb-2 text-green-800">{category.name}</h3>
                    <p className="text-gray-600">{category.items}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-green-800">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-yellow-500 text-black font-bold text-2xl w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-green-800">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral Program */}
      <section className="py-16 px-4 bg-gradient-to-r from-yellow-400 to-yellow-500">
        <div className="container mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-green-800">
              JULESMARKET Referral Reward Program
            </h2>
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4 text-green-700">Get Paid to Share JULESMARKET</h3>
              <div className="max-w-2xl mx-auto">
                <p className="text-lg mb-4">Refer someone who buys ₦60,000+ and earn ₦2,000 credit after they pay.</p>
                <p className="text-lg mb-6">Each extra customer earns you an additional ₦1,000.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl mb-2">🥚</div>
                <h4 className="font-semibold text-green-800">Farm-Fresh Eggs</h4>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl mb-2">🚪</div>
                <h4 className="font-semibold text-green-800">Doorstep Delivery</h4>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl mb-2">⭐</div>
                <h4 className="font-semibold text-green-800">Unique Customer Service</h4>
              </div>
            </div>

            <div className="text-center">
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-700" />
                  <span className="font-semibold">08086674607</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-green-700" />
                  <span className="font-semibold">julesmarket247@gmail.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-green-800">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUs.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-green-800">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Terms & Conditions */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-green-800">Terms & Conditions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {terms.map((term, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                <span className="text-gray-700">{term}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location & Payment */}
      <section className="py-16 px-4 bg-green-700 text-white">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Location & Payment Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-6 w-6" />
                Location
              </h3>
              <p className="text-lg leading-relaxed">
                Bode Fapounda Street (Formerly Alor),
                <br />
                Off Alhaji Agbeke Street,
                <br />
                Marcity Bus Stop, AGO
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4">Payment Details</h3>
              <div className="bg-white text-green-800 p-4 rounded-lg">
                <p className="font-semibold mb-2">Petregimma Global Investments Limited</p>
                <p className="text-lg">
                  Account Number: <span className="font-bold">0081707488</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-green-800 text-white py-8 px-4">
        <div className="container mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4 italic">JULESMARKET</h3>
          <p className="mb-4">Fresh farm produce delivered to your doorstep</p>
          <div className="flex justify-center gap-6">
            <Link href="tel:08086674607" className="hover:text-yellow-300 transition-colors">
              <Phone className="h-6 w-6" />
            </Link>
            <Link href="mailto:julesmarket247@gmail.com" className="hover:text-yellow-300 transition-colors">
              <Mail className="h-6 w-6" />
            </Link>
            <Link
              href="https://wa.link/4sc980"
              className="hover:text-yellow-300 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-6 w-6" />
            </Link>
          </div>
          <p className="mt-4 text-sm opacity-75">© 2024 JULESMARKET. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

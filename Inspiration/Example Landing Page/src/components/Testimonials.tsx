import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Care Coordinator",
    facility: "Melbourne Aged Care Services",
    content: "I was spending 3-4 hours daily on documentation. Now with CoPilot's transcription, I get perfect notes in minutes. It's captured details I would have missed, making our care reports so much better.",
    rating: 5,
    initials: "SM"
  },
  {
    name: "Michael Chen",
    role: "Clinical Manager",
    facility: "Sydney Care Solutions",
    content: "The AI summaries are incredibly accurate. It picks up on medical terminology and care nuances that generic transcription services miss. Our compliance audits have never been smoother.",
    rating: 5,
    initials: "MC"
  },
  {
    name: "Linda Rodriguez",
    role: "Team Leader",
    facility: "Brisbane Community Care",
    content: "Family phone calls are now properly documented without interrupting the conversation. The summaries help me brief other staff members perfectly, ensuring continuity of care.",
    rating: 5,
    initials: "LR"
  }
];

export function Testimonials() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="w-fit mx-auto mb-4">
            <Star className="w-4 h-4 mr-2" />
            Customer Stories
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Care Professionals
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Hear from Australian aged care professionals who've transformed their documentation workflow with our transcription CoPilot.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 relative">
              <CardContent className="p-8">
                <Quote className="w-8 h-8 text-blue-600 mb-4 opacity-60" />
                
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    <p className="text-xs text-gray-500">{testimonial.facility}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PropertyInput {
  title: string;
  property_type: string;
  location: string;
  city: string;
  state: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  parking_spaces?: number;
  land_size_sqm?: number;
  built_area_sqm?: number;
  features?: string[];
}

function generateDescription(property: PropertyInput): string {
  const formatPrice = (price: number) => {
    if (price >= 1000000000) {
      return `₦${(price / 1000000000).toFixed(1)} Billion`;
    }
    return `₦${(price / 1000000).toFixed(1)} Million`;
  };

  const propertyTypeLabels: Record<string, string> = {
    apartment: 'apartment',
    house: 'detached house',
    land: 'land',
    commercial: 'commercial property',
    duplex: 'duplex',
    townhouse: 'townhouse',
    villa: 'luxury villa',
    office: 'office space',
  };

  const propertyLabel = propertyTypeLabels[property.property_type] || property.property_type;
  const priceFormatted = formatPrice(property.price);

  let description = `**${property.title}**\n\n`;

  description += `Discover this exceptional ${propertyLabel} located in the prime area of ${property.location}, ${property.city}, ${property.state}. Listed at ${priceFormatted}, this property offers an incredible opportunity for homeowners and investors alike.\n\n`;

  // Details section
  description += `**Property Highlights:**\n`;

  if (property.bedrooms || property.bathrooms) {
    description += `This ${property.bedrooms || 0}-bedroom${property.bathrooms ? `, ${property.bathrooms}-bathroom` : ''} ${propertyLabel} is designed for comfortable living with well-appointed spaces throughout. `;
  }

  if (property.built_area_sqm) {
    description += `Spanning approximately ${property.built_area_sqm.toLocaleString()} square meters of built-up area`;
    if (property.land_size_sqm) {
      description += ` on a ${property.land_size_sqm.toLocaleString()} square meter plot`;
    }
    description += `. `;
  } else if (property.land_size_sqm) {
    description += `The property sits on a generous ${property.land_size_sqm.toLocaleString()} square meter plot. `;
  }

  if (property.parking_spaces && property.parking_spaces > 0) {
    description += `Secure parking is available for ${property.parking_spaces} vehicle${property.parking_spaces > 1 ? 's' : ''}. `;
  }

  // Location benefits
  description += `\n\n**Location Benefits:**\n`;
  description += `${property.location} in ${property.city} is a highly sought-after neighborhood known for its`;

  // Context-specific location details based on Nigerian cities
  const cityHighlights: Record<string, string[]> = {
    'Lagos': [
      'excellent infrastructure',
      'proximity to business districts',
      'vibrant community',
    ],
    'Abuja': [
      'planned urban layout',
      'modern amenities',
      'serene environment',
    ],
    'Port Harcourt': [
      'energy hub connectivity',
      'growing commercial presence',
      'strategic location',
    ],
  };

  const highlights = cityHighlights[property.city] || ['convenient amenities', 'good road network', 'peaceful atmosphere'];
  description += ` ${highlights.join(', ')}. Enjoy easy access to schools, shopping centers, healthcare facilities, and major transportation routes.\n\n`;

  // Features section
  if (property.features && property.features.length > 0) {
    description += `**Key Features:**\n`;
    property.features.forEach((feature) => {
      description += `• ${feature}\n`;
    });
    description += `\n`;
  }

  // Why this property
  description += `**Why This Property?**\n`;
  description += `This ${propertyLabel} represents excellent value in today's Nigerian real estate market. `;

  if (property.property_type === 'land') {
    description += `Land in ${property.city} continues to appreciate, making this an ideal investment for future development or resale. `;
  } else if (property.property_type === 'commercial' || property.property_type === 'office') {
    description += `Its strategic location makes it perfect for businesses seeking visibility and accessibility. `;
  } else {
    description += `Whether you're looking for a family home, a rental investment, or your next property venture, this listing ticks all the boxes. `;
  }

  description += `\n\n**Schedule a Viewing:**\n`;
  description += `Don't miss out on this opportunity! Contact us today to arrange a private viewing and experience firsthand all that this ${propertyLabel} has to offer. Our team is ready to assist you through every step of the purchase process.\n\n`;

  description += `*Price and availability subject to terms and conditions. All measurements approximate.*`;

  return description;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const property: PropertyInput = await req.json();

    if (!property.title || !property.property_type || !property.location || !property.city || !property.price) {
      return new Response(
        JSON.stringify({ error: "Missing required property details" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const description = generateDescription(property);

    return new Response(
      JSON.stringify({ description }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error generating description:", err);
    return new Response(
      JSON.stringify({ error: "Failed to generate description" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

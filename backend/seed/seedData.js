require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ai_pricing';

// ─── Helper ───────────────────────────────────────
const rand = (min, max) => Math.round((Math.random() * (max - min) + min) * 100) / 100;
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const adjPrice = (base) => {
    const demand = randInt(20, 95);
    let ai = base;
    if (demand > 80) ai *= 1.08;
    else if (demand < 40) ai *= 0.92;
    return { aiPrice: Math.round(ai * 100) / 100, competitorPrice: Math.round(base * rand(0.88, 1.12) * 100) / 100, demand };
};
// Category-relevant Unsplash photo ID pools
const IMGS = {
    Dresses: [
        'photo-1515886657613-9f3515b0c78f', 'photo-1496747611176-843222e1e57c', 'photo-1467043237213-65f2da53396f',
        'photo-1572804013309-59a88b7e92f1', 'photo-1612336307429-8a898d10e223', 'photo-1490481651871-ab68de25d43d',
        'photo-1539109136881-3be0616acf4b', 'photo-1609505848912-b7c3b9ae50c7', 'photo-1585487000160-6ebcfceb0d03',
    ],
    Bags: [
        'photo-1548036328-c9fa89d128fa', 'photo-1584917865442-de89df76afd3', 'photo-1591561954557-26941169b49e',
        'photo-1553062407-98eeb64c6a62', 'photo-1566150905458-1bf1fc113f0d', 'photo-1594938298603-c8148c4b4ffa',
        'photo-1614179818511-4f5dfdf3e7e3', 'photo-1591348278863-a8fb3887e2aa',
    ],
    Skincare: [
        'photo-1556228578-0d85b1a4d571', 'photo-1571781926291-c477ebfd024b', 'photo-1620916566398-39f1143ab7be',
        'photo-1598440947619-2c35fc9aa908', 'photo-1612817288484-6f916006741a', 'photo-1631390171928-8c7b1a2e7ab3',
        'photo-1570194065650-d99fb4bedf0a', 'photo-1617897903246-719242758050',
    ],
    Makeup: [
        'photo-1522335789203-aabd1fc54bc9', 'photo-1596462502278-27bfdc403348', 'photo-1583241475880-083f84372725',
        'photo-1631214500004-40f1d33f2e59', 'photo-1503236823255-94609f598e71', 'photo-1560707303-4e980ce876ad',
        'photo-1559827260-dc66d52bef19', 'photo-1512207736890-6ffed8a84e8d',
    ],
    'Electronic Gadgets': [
        'photo-1498049794561-7780e7231661', 'photo-1518770660439-4636190af475', 'photo-1496181133206-80ce9b88a853',
        'photo-1544866092-1935c5ef2a8f', 'photo-1585771724684-38269d6639fd', 'photo-1525547719571-a2d4ac8945e2',
        'photo-1511707171634-5f897ff02aa9', 'photo-1593305841991-05c297ba4575',
    ],
    'Pet Store': [
        'photo-1587300003388-59208cc962cb', 'photo-1543466835-00a7907e9de1', 'photo-1548767797-d8c844163c4a',
        'photo-1425082661705-1834bfd09dca', 'photo-1444212477490-ca407925329e', 'photo-1536240478700-b869ad10f1c1',
        'photo-1561037404-61cd46aa615b', 'photo-1537151608828-ea2b11777ee8',
    ],
    'Kitchen Utensils': [
        'photo-1556909114-f6e7ad7d3136', 'photo-1509358271058-acd22cc93898', 'photo-1596040033229-a9821ebd4d08',
        'photo-1585515320310-259814833e62', 'photo-1547592166-23ac45744acd', 'photo-1516685125522-3d528b8e9b8b',
        'photo-1551218808-94e220e084d2', 'photo-1589302168068-964664d93dc0',
    ],
    'Hair Care': [
        'photo-1527799820374-dcf8d9d4a388', 'photo-1522337360788-8b13dee7a37e', 'photo-1519699047748-de8e457a634e',
        'photo-1580618672591-eb180b1a973f', 'photo-1498843053639-170ff2122f35', 'photo-1617922671563-af5f3d9ca60e',
        'photo-1519681393784-d120267933ba', 'photo-1595476108010-b4d1f102b1b1',
    ],
};
const imgFor = (cat, idx) => { const pool = IMGS[cat] || IMGS['Skincare']; const id = pool[idx % pool.length]; return `https://images.unsplash.com/${id}?w=400&h=280&fit=crop&auto=format`; };

// ─── Product Definitions ──────────────────────────
function makeProducts() {
    const products = [];

    // 1. DRESSES
    const dressItems = [
        'Floral Maxi Dress', 'Cocktail Wrap Dress', 'Boho Sundress', 'Elegant Evening Gown', 'Casual Shirt Dress',
        'Vintage Midi Dress', 'Summer Off-Shoulder Dress', 'Linen Lace Dress', 'Party Sequin Dress', 'Smart Shirt Dress',
        'Traditional Kurta Dress', 'Anarkali Suit Dress', 'Halter Neck Dress', 'Cold Shoulder Dress', 'Printed Saree Dress',
        'Georgette Wrap Dress', 'Silk Evening Dress', 'Cotton A-Line Dress', 'Bodycon Mini Dress', 'Chikankari Dress',
        'Denim Shirt Dress', 'Stripe Fit & Flare Dress', 'Asymmetric Hem Dress', 'Kimono Wrap Dress', 'Organza Gown',
        'Velvet Party Dress', 'Tie-Dye Maxi Dress', 'Ruffle Hem Dress', 'Embroidered Ethnic Dress', 'Sleeveless Jumpsuit Dress',
    ];
    let idx = 0;
    dressItems.forEach(name => {
        const base = rand(499, 4999);
        const { aiPrice, competitorPrice, demand } = adjPrice(base);
        products.push({ name, category: 'Dresses', image: imgFor('Dresses', idx++), basePrice: base, currentPrice: base, aiPrice, competitorPrice, demand, stock: randInt(20, 200), inventory: randInt(20, 200), rating: rand(3.5, 5), reviewCount: randInt(5, 300), sentimentScore: randInt(45, 95), description: `${name} — premium quality fabric with elegant design.`, priceHistory: [{ price: base }] });
    });

    // 2. BAGS
    const bagItems = [
        'Leather Tote Bag', 'Canvas Backpack', 'Ethnic Clutch Bag', 'Crossbody Shoulder Bag', 'Suede Hobo Bag',
        'Mini Sling Bag', 'Travel Duffel Bag', 'Metallic Evening Clutch', 'Jute Eco Bag', 'Office Laptop Bag',
        'Quilted Handbag', 'Wicker Rattan Bag', 'Beaded Party Clutch', 'Printed Canvas Bag', 'Potli Bag',
        'Studded Bucket Bag', 'Bohemian Fringe Bag', 'Velvet Toiletry Pouch', 'Checkered Tote', 'Croc-Embossed Bag',
        'Drawstring Bundle Bag', 'Flap Envelope Clutch', 'Jumbo Tote Bag', 'Faux Leather Baguette', 'Satchel Messenger Bag',
        'Woven Straw Bag', 'Beige Structured Bag', 'Geometric Clutch', 'Kilim Patterned Bag', 'Multi-Pocket Backpack',
    ];
    let bagIdx = 0;
    bagItems.forEach(name => {
        const base = rand(299, 3999);
        const { aiPrice, competitorPrice, demand } = adjPrice(base);
        products.push({ name, category: 'Bags', image: imgFor('Bags', bagIdx++), basePrice: base, currentPrice: base, aiPrice, competitorPrice, demand, stock: randInt(30, 250), inventory: randInt(30, 250), rating: rand(3.5, 5), reviewCount: randInt(5, 250), sentimentScore: randInt(50, 95), description: `${name} — stylish and durable for every occasion.`, priceHistory: [{ price: base }] });
    });

    // 3. SKINCARE
    const skincareItems = [
        'Vitamin C Brightening Serum', 'Hyaluronic Acid Moisturiser', 'Niacinamide 10% Serum', 'Rose Water Face Mist',
        'SPF 50 Sunscreen Gel', 'Retinol Anti-Ageing Cream', 'Green Tea Face Wash', 'Charcoal Detox Mask',
        'Aloe Vera Soothing Gel', 'Kumkumadi Tailam Serum', 'Ubtan Face Pack', 'Under-Eye Dark Circle Cream',
        'Salicylic Acid BHA Serum', 'Ceramide Barrier Repair Cream', 'Papaya Enzyme Exfoliator', 'Turmeric Glow Cream',
        'Micellar Water Cleanser', 'Snail Mucin Essence', 'AHA Glycolic Acid Toner', 'Peptide Night Cream',
        'Licorice Root Dark Spot Serum', 'Tea Tree Spot Gel', 'Collagen Face Cream', 'Glutathione Skin Brightener',
        'Neem & Tulsi Face Wash', 'Multani Mitti Mask', 'SPF 30 Tinted Moisturiser', 'Bakuchiol Serum (Vegan Retinol)',
        'Skin Barrier Recovery Oil', 'Tranexamic Acid Serum',
    ];
    let skinIdx = 0;
    skincareItems.forEach(name => {
        const base = rand(199, 2999);
        const { aiPrice, competitorPrice, demand } = adjPrice(base);
        products.push({ name, category: 'Skincare', image: imgFor('Skincare', skinIdx++), basePrice: base, currentPrice: base, aiPrice, competitorPrice, demand, stock: randInt(50, 500), inventory: randInt(50, 500), rating: rand(3.8, 5), reviewCount: randInt(20, 500), sentimentScore: randInt(55, 95), description: `${name} — dermatologist-tested formula for glowing skin.`, priceHistory: [{ price: base }] });
    });

    // 4. MAKEUP
    const makeupItems = [
        'Matte Liquid Lipstick', 'Full Coverage Foundation', 'Volumizing Mascara', 'Kohl Kajal Eyeliner',
        'Blusher Palette Quad', 'Highlighter & Bronzer Duo', 'Eyeshadow Palette 18 Shades', 'Translucent Setting Powder',
        'Waterproof Eyeliner Pen', 'Tinted Lip Balm SPF', 'Contouring Stick Duo', 'HD Foundation Primer',
        'Brow Pomade & Pencil Set', 'Glitter Eye Pigment', 'Lip Liner Nude Set', 'CC Cream SPF 40',
        'Blotting Paper 100 Sheets', 'Face Mist Makeup Setting Spray', 'Gel Eyeliner Pot', 'False Lash Glue',
        'Creamy Concealer Stick', 'Peach Blush Palette', 'Smoky Eye Kit', 'Bold Red Liquid Lipstick',
        'BB Cream Tinted SPF', 'Compact Powder Foundation', 'Metallic Eyeshadow Trio',
        'Makeup Brush Set 12Pc', 'Nude Lipstick Collection', 'Translucent Loose Powder',
    ];
    let mkpIdx = 0;
    makeupItems.forEach(name => {
        const base = rand(149, 1999);
        const { aiPrice, competitorPrice, demand } = adjPrice(base);
        products.push({ name, category: 'Makeup', image: imgFor('Makeup', mkpIdx++), basePrice: base, currentPrice: base, aiPrice, competitorPrice, demand, stock: randInt(50, 600), inventory: randInt(50, 600), rating: rand(3.6, 5), reviewCount: randInt(15, 600), sentimentScore: randInt(50, 92), description: `${name} — long-lasting formula with vibrant pigment.`, priceHistory: [{ price: base }] });
    });

    // 5. ELECTRONIC GADGETS
    const gadgetItems = [
        'TWS Bluetooth Earbuds', '4K Smart LED TV 43"', 'Wireless Charging Pad', 'Portable Power Bank 20000mAh',
        'Mechanical Gaming Keyboard', '27" QHD Monitor IPS', 'Smart Watch with Health Tracking', 'USB-C Hub 7-in-1',
        'Portable Bluetooth Speaker', 'Webcam 1080p HD', 'Noise Cancelling Headphones', 'Graphics Tablet Drawing Pad',
        'Mini Projector HD', 'Smart Home Hub Alexa', 'Wi-Fi 6 Mesh Router', 'Gaming Mouse RGB',
        'Dash Cam Front & Rear', 'Digital Photo Frame 10"', 'E-Reader 6" Ink Display', 'Smart Doorbell Camera',
        'Robot Vacuum Cleaner', 'Air Quality Monitor PM2.5', 'Smart LED RGB Bulb Pack', 'Fitness Tracker Band',
        'Portable SSD 1TB USB-C', 'Laptop Stand Aluminium', 'Desk Lamp with USB Port', 'Fast Charger 65W GaN',
        'True Wireless Neckband Earphones', 'Foldable Drone with Camera',
    ];
    let gadIdx = 0;
    gadgetItems.forEach(name => {
        const base = rand(499, 49999);
        const { aiPrice, competitorPrice, demand } = adjPrice(base);
        products.push({ name, category: 'Electronic Gadgets', image: imgFor('Electronic Gadgets', gadIdx++), basePrice: base, currentPrice: base, aiPrice, competitorPrice, demand, stock: randInt(10, 150), inventory: randInt(10, 150), rating: rand(3.7, 5), reviewCount: randInt(20, 800), sentimentScore: randInt(55, 95), description: `${name} — latest technology for your modern lifestyle.`, priceHistory: [{ price: base }] });
    });

    // 6. PET STORE
    const petItems = [
        'Premium Dog Dry Food 5kg', 'Cat Wet Food Pouches 12×85g', 'Dog Chew Toy Set', 'Cat Scratching Post Tower',
        'Dog Harness & Leash Set', 'Automatic Pet Water Fountain', 'Pet Carrier Bag Airline-Approved', 'Dog House Outdoor Wooden',
        'Cat Litter Bentonite 10kg', 'Pet Grooming Brush Set', 'Dog Training Clicker', 'Dental Chew Sticks 30Pc',
        'Aquarium Full Starter Kit', 'Bird Cage with Accessories', 'Reptile Heat Lamp Kit', 'Fish Food Premium Flakes',
        'Rabbit Hutch with Run', 'Hamster Wheel & Cage Set', 'Dog Raincoat Waterproof', 'Flea & Tick Collar Dog',
        'Cat Interactive Laser Toy', 'Dog Orthopaedic Memory Foam Bed', 'Pet First Aid Kit', 'Puppy Training Pad 50Pc',
        'Bird Seed Premium Mix', 'Dog Sweater Winter Knit', 'Cat Window Perch Suction', 'Pet ID Tag Engraved',
        'Self-Cleaning Cat Litter Box', 'Multi-Pet Feeding Station',
    ];
    let petIdx = 0;
    petItems.forEach(name => {
        const base = rand(99, 4999);
        const { aiPrice, competitorPrice, demand } = adjPrice(base);
        products.push({ name, category: 'Pet Store', image: imgFor('Pet Store', petIdx++), basePrice: base, currentPrice: base, aiPrice, competitorPrice, demand, stock: randInt(30, 400), inventory: randInt(30, 400), rating: rand(3.8, 5), reviewCount: randInt(10, 400), sentimentScore: randInt(60, 95), description: `${name} — premium quality for your beloved pets.`, priceHistory: [{ price: base }] });
    });

    // 7. KITCHEN UTENSILS
    const kitchenItems = [
        'Non-stick Kadai 28cm', 'Pressure Cooker 5L Aluminium', 'Stainless Steel Tawa', 'Copper Bottom Sauce Pan Set',
        'Idli Maker 4-Plate Steam', 'Roti Maker Electric', 'Mixer Grinder 750W 3 Jars', 'Air Fryer 4.5L Digital',
        'Induction Cooktop 2000W', 'Cast Iron Skillet Pre-Seasoned', 'Bamboo Cutting Board Set', 'Food Storage Container Set 10Pc',
        'Mortar & Pestle Stone', 'Chakla Belan Marble Set', 'Hand Juicer Stainless', 'Egg Boiler 7 Egg Electric',
        'Kitchen Knife Set 6Pc', 'Stainless Steel Colander', 'Measuring Cup & Spoon Set', 'Silicone Spatula Set 4Pc',
        'Rice Cooker 1.5L Digital', 'Mandoline Vegetable Slicer', 'Glass Storage Jars Set 6', 'Stainless Steel Ladle Set',
        'Electric Hand Blender 400W', 'Masala Dabba Spice Box Stainless', 'Vegetable Steamer Basket', 'Non-Stick Dosa Tawa 30cm',
        'Bottle Opener & Can Opener Set', 'Microwave-Safe Bowl Set 3Pc',
    ];
    let kitIdx = 0;
    kitchenItems.forEach(name => {
        const base = rand(99, 5999);
        const { aiPrice, competitorPrice, demand } = adjPrice(base);
        products.push({ name, category: 'Kitchen Utensils', image: imgFor('Kitchen Utensils', kitIdx++), basePrice: base, currentPrice: base, aiPrice, competitorPrice, demand, stock: randInt(40, 500), inventory: randInt(40, 500), rating: rand(3.7, 5), reviewCount: randInt(15, 500), sentimentScore: randInt(55, 92), description: `${name} — designed for the Indian kitchen.`, priceHistory: [{ price: base }] });
    });

    // 8. HAIR CARE (must include oils, shampoos, conditioners, serums, masks)
    const hairItems = [
        // Oils (6)
        'Coconut Hair Oil 500ml', 'Bhringraj Ayurvedic Hair Oil', 'Castor Oil for Hair Growth 200ml', 'Almond & Argan Hair Oil',
        'Onion Black Seed Hair Oil', 'Amla & Brahmi Hair Oil 300ml',
        // Shampoos (6)
        'Anti-Dandruff Ketoconazole Shampoo', 'Biotin & Collagen Hair Growth Shampoo', 'Smoothing Keratin Shampoo',
        'Colour-Protect Shampoo for Treated Hair', 'Scalp Purifying Tea Tree Shampoo', 'Volumising Thickening Shampoo',
        // Conditioners (5)
        'Deep Moisture Argan Conditioner', 'Leave-In Detangling Conditioner Spray', 'Color-Safe Hydrating Conditioner',
        'Keratin Smoothing Conditioner', 'Rice Water Strengthening Conditioner',
        // Serums (5)
        'Heat Protection Hair Serum 150ml', 'Frizz Control Smoothing Serum', 'Hair Growth Peptide Serum',
        'Shine Enhancing Glossing Serum', 'Split-End Repair Serum',
        // Masks (5)
        'Banana & Honey Deep Hair Mask', 'Protein Repair Hair Mask 200ml', 'Egg & Olive Oil Hair Mask',
        'Hibiscus & Amla Ayurvedic Mask', 'Fenugreek Hair Strengthening Mask',
        // Other (3)
        'Dry Shampoo No-Wash Spray', 'Hair Vitamin Biotin Gummies 60Pc', 'Silk Hair Wrap Sleep Cap',
    ];
    const hairSubCat = (name) => {
        if (name.includes('Oil')) return 'Hair Oil';
        if (name.includes('Shampoo')) return 'Shampoo';
        if (name.includes('Conditioner')) return 'Conditioner';
        if (name.includes('Serum')) return 'Hair Serum';
        if (name.includes('Mask')) return 'Hair Mask';
        return 'Other';
    };
    let hairIdx = 0;
    hairItems.forEach(name => {
        const base = rand(149, 1999);
        const { aiPrice, competitorPrice, demand } = adjPrice(base);
        products.push({ name, category: 'Hair Care', subCategory: hairSubCat(name), image: imgFor('Hair Care', hairIdx++), basePrice: base, currentPrice: base, aiPrice, competitorPrice, demand, stock: randInt(50, 600), inventory: randInt(50, 600), rating: rand(3.7, 5), reviewCount: randInt(20, 600), sentimentScore: randInt(55, 95), description: `${name} — specialist hair care formulated for Indian hair types.`, priceHistory: [{ price: base }] });
    });

    return products;
}

// ─── Seed ─────────────────────────────────────────
async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing
    await Promise.all([User.deleteMany(), Product.deleteMany(), Order.deleteMany(), Review.deleteMany()]);
    console.log('🧹 Cleared existing data');

    // Create users
    // Create users — admin + 15 diverse customers
    const adminUser = await User.create({ name: 'Admin', email: 'admin@aipricing.com', password: 'admin123', role: 'admin', segment: 'Premium', verifiedCustomer: true });
    const customers = await User.insertMany([
        { name: 'Akshaya J', email: 'akshaya@example.com', password: 'user123', role: 'customer', segment: 'Regular', verifiedCustomer: true },
        { name: 'Rahul Kumar', email: 'rahul@example.com', password: 'user123', role: 'customer', segment: 'Budget', verifiedCustomer: false },
        { name: 'Priya Sharma', email: 'priya@example.com', password: 'user123', role: 'customer', segment: 'Premium', verifiedCustomer: true },
        { name: 'Sneha Reddy', email: 'sneha@example.com', password: 'user123', role: 'customer', segment: 'Regular', verifiedCustomer: true },
        { name: 'Arjun Menon', email: 'arjun@example.com', password: 'user123', role: 'customer', segment: 'Budget', verifiedCustomer: false },
        { name: 'Divya Nair', email: 'divya@example.com', password: 'user123', role: 'customer', segment: 'Regular', verifiedCustomer: true },
        { name: 'Karthik Rajan', email: 'karthik@example.com', password: 'user123', role: 'customer', segment: 'Premium', verifiedCustomer: true },
        { name: 'Meera Pillai', email: 'meera@example.com', password: 'user123', role: 'customer', segment: 'Regular', verifiedCustomer: true },
        { name: 'Rohan Gupta', email: 'rohan@example.com', password: 'user123', role: 'customer', segment: 'Budget', verifiedCustomer: false },
        { name: 'Ananya Iyer', email: 'ananya@example.com', password: 'user123', role: 'customer', segment: 'Premium', verifiedCustomer: true },
        { name: 'Vikram Sethi', email: 'vikram@example.com', password: 'user123', role: 'customer', segment: 'Regular', verifiedCustomer: false },
        { name: 'Lakshmi Devi', email: 'lakshmi@example.com', password: 'user123', role: 'customer', segment: 'Budget', verifiedCustomer: true },
        { name: 'Nikhil Verma', email: 'nikhil@example.com', password: 'user123', role: 'customer', segment: 'Regular', verifiedCustomer: true },
        { name: 'Pooja Agarwal', email: 'pooja@example.com', password: 'user123', role: 'customer', segment: 'Premium', verifiedCustomer: true },
        { name: 'Sanjay Tiwari', email: 'sanjay@example.com', password: 'user123', role: 'customer', segment: 'Budget', verifiedCustomer: false },
    ]);
    const customer1 = customers[0];
    const customer2 = customers[1];
    console.log(`👤 Users created: ${customers.length + 1}`);

    // Seed products
    const productDefs = makeProducts();
    const products = await Product.insertMany(productDefs);
    console.log(`📦 Products seeded: ${products.length} across 8 categories`);

    // Create sample orders
    const sampleItems = products.slice(0, 6).map(p => ({ product: p._id, name: p.name, price: p.aiPrice, quantity: 1, image: p.image }));
    const totalAmt = sampleItems.reduce((s, i) => s + i.price, 0);
    await Order.create({ user: customer1._id, items: sampleItems, totalAmount: totalAmt, status: 'delivered', address: { street: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' } });
    // Additional orders for other customers
    for (let c = 2; c < 5; c++) {
        const items = products.slice(c * 5, c * 5 + 3).map(p => ({ product: p._id, name: p.name, price: p.aiPrice, quantity: 1, image: p.image }));
        await Order.create({ user: customers[c]._id, items, totalAmount: items.reduce((s, i) => s + i.price, 0), status: ['processing', 'shipped', 'delivered'][c % 3], address: { street: `${c + 10} Anna Salai`, city: 'Chennai', state: 'Tamil Nadu', pincode: '600002' } });
    }
    console.log('🛒 Sample orders created');

    // Category-specific review banks — unique per product
    const REVIEW_BANKS = {
        'Dresses': [
            ['This dress is absolutely gorgeous! The fabric feels premium and the fit is perfect.', 5],
            ['Wore it to a wedding — got so many compliments! Great stitching.', 5],
            ['Beautiful design but runs slightly small. Order one size up.', 4],
            ['Loved the colour in person, even better than the photos!', 5],
            ['The material is comfortable even in summer heat. Very happy!', 4],
            ['Decent dress, but the zipping zipper broke after 2 washes.', 2],
            ['Amazing ethnic pattern! Looks very premium for the price.', 5],
            ['Packaging was great, dress arrived neatly folded and pressed.', 4],
            ['Not exactly the shade shown online, slightly different. Material is okay.', 3],
            ['Perfect for festivals! The embroidery detail is stunning.', 5],
            ['Comfortable fit, good material but stitching could be better.', 3],
            ['Returned it — the colour faded after first wash. Very disappointing.', 1],
            ['Great daily wear dress! Light, breezy, and stylish.', 4],
            ['Absolutely love this! My daughter wore it for her birthday.', 5],
            ['Arrived on time, good packaging. Dress quality is decent.', 3],
        ],
        'Bags': [
            ['Sturdy and spacious — fits everything including my laptop!', 5],
            ['Beautiful design but the zipper feels a bit flimsy.', 3],
            ['Great value for money. Very stylish and functional.', 4],
            ['Exactly as pictured. Premium quality leather. Love it!', 5],
            ['The strap broke within a month. Very poor quality.', 1],
            ['Perfect size for daily office use. Very professional look.', 5],
            ['Stylish bag but the interior has a strange smell initially.', 3],
            ['Bought as a gift — she absolutely loved it! Great packaging.', 5],
            ['Good bag, but colour is slightly lighter than shown online.', 3],
            ['Very spacious, good number of compartments. Highly recommend.', 4],
            ['The bag is decent for the price. Not luxury but good value.', 4],
            ['Handle started peeling after 2 months. Disappointed.', 2],
            ['Lightweight and fashionable. Perfect for travel!', 5],
            ['Great for ethnic outfits. Complements my look beautifully.', 4],
            ['Looks expensive, costs less. Exactly what I wanted.', 5],
        ],
        'Skincare': [
            ['My skin has never felt so smooth! Visible glow in 2 weeks.', 5],
            ['Dermatologist recommended this to me and it works wonders.', 5],
            ['Good for dry skin. Keeps skin hydrated throughout the day.', 4],
            ['Caused breakouts on my sensitive skin. Returning.', 1],
            ['Great serum! Fades dark spots noticeably. 10/10.', 5],
            ['Nothing extraordinary. Moisturises okay but nothing special.', 3],
            ['Love the lightweight texture! Absorbs quickly, no sticky feel.', 5],
            ['The sunscreen leaves a white cast. Not great for Indian skin tones.', 2],
            ['Been using for 3 months — significant improvement in skin texture.', 4],
            ['Great ingredients but the fragrance is too strong for me.', 3],
            ['Works exactly as described. Pigmentation has reduced a lot.', 5],
            ['Packaging is premium but quantity is too little for the price.', 3],
            ['My holy grail skincare product! Reordering every month.', 5],
            ['Saw results within 2 weeks. Even skin tone and reduced pores.', 5],
            ['Did not work for my oily skin. Pores still visible.', 2],
        ],
        'Makeup': [
            ['The lipstick lasts all day! No need to reapply. Superb!', 5],
            ['The eyeshadow pigmentation is unreal for this price!', 5],
            ['Foundation shade does not match — needs more Indian skin shades.', 2],
            ['Long lasting, does not smudge. Exactly what I needed.', 5],
            ['Beautiful packaging! The product quality is equally impressive.', 4],
            ['The mascara clumps a little but overall performance is good.', 3],
            ['Blush colour is perfect — natural looking and buildable.', 5],
            ['These brushes are so soft! Makeup applies flawlessly.', 5],
            ['Kajal is super black and lasts 10+ hours. My daily go-to.', 5],
            ['Setting powder works well but slips a bit in humidity.', 3],
            ['The lipstick bleeds after a few hours. Not my favourite.', 2],
            ['Best budget foundation I have tried! Good coverage.', 4],
            ['Love the highlighter! Gives a beautiful natural glow.', 5],
            ['Disappointed — the primer did not help with oily skin.', 2],
            ['Great value set! I gifted this and my friend loved it.', 5],
        ],
        'Electronic Gadgets': [
            ['Sound quality is incredible for this price. Bass is deep!', 5],
            ['Battery lasts 18+ hours. Absolute value for money.', 5],
            ['Setup was easy, works seamlessly with all my devices.', 4],
            ['The device stopped working after 2 months. Very poor.', 1],
            ['4K picture quality is stunning. Smart TV features work great.', 5],
            ['The keyboard has satisfying tactile feedback. Love it!', 5],
            ['Not as powerful as advertised. App support is limited.', 2],
            ['Great webcam for online meetings! Clear video and audio.', 4],
            ['Charging speed is insane — 0 to 100% in 45 minutes!', 5],
            ['Build feel is premium. Looks expensive but isn\'t.', 4],
            ['The mouse has perfect accuracy for gaming sessions.', 5],
            ['Speaker sound distorts at high volumes. Disappointing.', 2],
            ['Smart home integration works perfectly with Alexa.', 4],
            ['The SSD speed is blazing fast! Transferred 100GB in minutes.', 5],
            ['Product is decent but the app has too many bugs.', 3],
        ],
        'Pet Store': [
            ['My dog absolutely loves this food! Coat is shiny and healthier.', 5],
            ['Great quality toy — my cat plays with it every day!', 5],
            ['The carrier is well-ventilated and my pet feels comfortable.', 4],
            ['Food packaging was damaged on arrival. Quality of food is okay.', 3],
            ['My puppy loves this chew toy. Very durable!', 5],
            ['The scratching post is very sturdy. My cat uses it daily.', 5],
            ['The harness is adjustable and fits perfectly. No chafing.', 4],
            ['My dog does not seem to like this food. Picky eater.', 2],
            ['Great water fountain! My cat drinks much more water now.', 5],
            ['The litter clumps perfectly and controls odour well.', 4],
            ['Grooming brush is very effective for shedding season.', 5],
            ['Aquarium kit is complete but filter is louder than expected.', 3],
            ['Dog bed is very soft and my pet sleeps soundly in it.', 5],
            ['The pet first aid kit is comprehensive. Very useful!', 4],
            ['Arriving damaged — the cage was bent. Refund requested.', 1],
        ],
        'Kitchen Utensils': [
            ['Non-stick coating is excellent! Nothing sticks at all.', 5],
            ['Pressure cooker builds pressure quickly. Saves so much time.', 5],
            ['Good quality steel, easy to clean, and very durable.', 4],
            ['The handle came loose after a few weeks. Disappointed.', 2],
            ['Idli maker is perfect — soft fluffy idlis every time!', 5],
            ['Roti maker is easy to use and makes perfect round rotis!', 5],
            ['Mixer grinder is powerful and quiet. Great buy.', 5],
            ['Air fryer makes everything crispy with very little oil!', 5],
            ['Induction cooktop heats evenly and very quickly.', 4],
            ['Cast iron skillet is heavy but seasons beautifully.', 4],
            ['The knife set arrived with a slight rust on blade. Refunded.', 1],
            ['Storage containers have excellent airtight seals. Food stays fresh.', 5],
            ['Food quality product and looks premium in my kitchen!', 4],
            ['The blender is loud but works very powerfully.', 3],
            ['Great set of utensils for everyday Indian cooking.', 5],
        ],
        'Hair Care': [
            ['Hair fall has reduced significantly since using this oil!', 5],
            ['The shampoo lathers well and leaves hair clean and fresh.', 4],
            ['My hair feels so soft and manageable after this conditioner.', 5],
            ['The oil is slightly greasy — needs only a small amount.', 3],
            ['Biotin gummies are easy to take and I see less breakage.', 4],
            ['Keratin shampoo made my frizzy hair super smooth!', 5],
            ['This serum is my holy grail for heat protection!', 5],
            ['Hair mask smells amazing and leaves hair very nourished.', 5],
            ['The dry shampoo works great between washes. Saves time!', 4],
            ['Onion oil has a strong smell but the results are worth it.', 4],
            ['Did not see results even after 2 months. Waste of money.', 1],
            ['Conditioner spray is excellent for detangling wet hair.', 5],
            ['Rice water conditioner made my hair incredibly strong.', 5],
            ['The serum is very lightweight — does not weigh hair down.', 4],
            ['Fenugreek mask is messy to apply but results are excellent!', 4],
        ],
    };

    const reviewInserts = [];
    const usedCombos = new Set();

    // Give each product a VARIED number of reviews with CATEGORY-SPECIFIC text
    for (let pi = 0; pi < products.length; pi++) {
        const p = products[pi];
        const bank = REVIEW_BANKS[p.category] || REVIEW_BANKS['Skincare'];

        // Vary number of reviews: products with high sentiment get more, others fewer
        const numReviews = [1, 1, 2, 2, 3, 1, 2, 4, 1, 3][pi % 10];

        for (let rn = 0; rn < numReviews; rn++) {
            const custIdx = (pi * 5 + rn * 11 + 3) % customers.length;
            const combo = `${p._id}-${customers[custIdx]._id}`;
            if (usedCombos.has(combo)) continue;
            usedCombos.add(combo);

            // Pick a review from the category bank, offset by product index
            const bankIdx = (pi * 3 + rn * 7) % bank.length;
            const [text, rating] = bank[bankIdx];

            reviewInserts.push({
                product: p._id,
                user: customers[custIdx]._id,
                rating,
                reviewText: text,
                verifiedPurchase: rn === 0, // first reviewer is always verified
                sentiment: rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative',
            });
        }
    }

    await Review.insertMany(reviewInserts);
    console.log(`⭐ ${reviewInserts.length} reviews created across all products from 15 customers`);

    console.log('\n🎉 DATABASE SEEDED SUCCESSFULLY!\n');
    console.log('─────────────────────────────');
    console.log('LOGIN CREDENTIALS:');
    console.log('Admin:    admin@aipricing.com / admin123');
    console.log('Customer: akshaya@example.com / user123');
    console.log('─────────────────────────────\n');

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });

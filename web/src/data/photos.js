// Real Unsplash photos of professionals doing the actual work
// Format: https://images.unsplash.com/photo-{ID}?w=600&q=80&fit=crop&crop=faces,center

const U = (id, w = 600, h = 400) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&q=80&fit=crop&crop=center`;

export const SERVICE_PHOTOS = {
  plumbing:   U('1607472586893-edb57bdc0e39'),
  electrical: U('1621905251189-08b45d6a269e'),
  cleaning:   U('1581578731548-c64695cc6952'),
  painting:   U('1562259949-e8e7689d7828'),
};

export const CATEGORY_PHOTOS = {
  // ── Plumbing ──
  'leak-repairs':       U('1558618666-fcd25c85cd64'),   // fixing pipe under sink
  'drainage':           U('1585771724684-38269d6639fd'), // drain/pipe work
  'toilet-bathroom':    U('1552321554-5fefe8c9ef14'),   // bathroom plumbing
  'kitchen-plumbing':   U('1556909114-f6e7ad7d3136'),   // kitchen sink repair
  'water-system':       U('1504328345606-18bbc8c9d7d1'), // water system
  'installations':      U('1504307651254-35680f356dfd'), // pipe installation
  'emergency-plumbing': U('1558618047-3c8d5d7f6c9a'),   // emergency repair
  'inspection':         U('1581091012615-66a1b8ca86d8'), // inspection

  // ── Electrical ──
  'socket-switch':      U('1565193566173-7a0ee3dbe261'), // electrical socket
  'lighting':           U('1524484485831-a92ffc0de03f'), // lighting work
  'wiring':             U('1509391111540-a7e3db30d98e'), // electrical wiring
  'safety':             U('1581092921461-eab10380ed66'), // safety check
  'fan-ac':             U('1621905252507-b35492cc74b4'), // AC/fan install
  'solar':              U('1509391111540-a7e3db30d98e'), // solar panel
  'emergency-elec':     U('1616763355548-1b606f439f86'), // electrical emergency
  'appliances':         U('1556909114-f6e7ad7d3136'),   // appliance work
  'elec-inspection':    U('1621905251189-08b45d6a269e'), // electrical inspection

  // ── Cleaning ──
  'general-cleaning':   U('1581578731548-c64695cc6952'), // general cleaning
  'deep-cleaning':      U('1527515637462-cff94aca55e2'), // deep clean bathroom
  'kitchen-cleaning':   U('1556909114-f6e7ad7d3136'),   // kitchen cleaning
  'bathroom-cleaning':  U('1552321554-5fefe8c9ef14'),   // bathroom cleaning
  'carpet-cleaning':    U('1558618666-fcd25c85cd64'),   // carpet cleaning
  'laundry':            U('1517677129300-07b130802f46'), // laundry/ironing
  'office-cleaning':    U('1497366216548-37526070297c'), // office cleaning
  'move-cleaning':      U('1558467914-2d03f2a23e9e'),   // move-in/out cleaning
  'sofa-upholstery':    U('1555041469-a586c61ea9bc'),   // sofa cleaning
  'pest-control':       U('1558618047-3c8d5d7f6c9a'),   // pest control

  // ── Painting ──
  'interior-painting':  U('1589939705384-5185137a7f0f'), // interior painting
  'exterior-painting':  U('1562259949-e8e7689d7828'),   // exterior painting
  'texture-painting':   U('1558618666-fcd25c85cd64'),   // texture work
  'waterproofing':      U('1504328345606-18bbc8c9d7d1'), // waterproofing
  'decorative':         U('1589939705384-5185137a7f0f'), // decorative painting
  'epoxy-flooring':     U('1558618047-3c8d5d7f6c9a'),   // epoxy floor
  'surface-prep':       U('1562259949-e8e7689d7828'),   // surface preparation
  'painting-consult':   U('1503455637927-1f85b7560b94'), // consultation
};

// Fallback photo per service if category not found
export const SERVICE_FALLBACK = {
  plumbing:   U('1607472586893-edb57bdc0e39'),
  electrical: U('1621905251189-08b45d6a269e'),
  cleaning:   U('1581578731548-c64695cc6952'),
  painting:   U('1562259949-e8e7689d7828'),
};

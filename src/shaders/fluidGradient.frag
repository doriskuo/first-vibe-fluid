precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform float uScrollProgress;

#define PI 3.14159265359

// ========== Simplex Noise ==========
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// FBM (Fractal Brownian Motion) - optimized with fewer octaves
float fbm(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 4; i++) {
    if (i >= octaves) break;
    value += amplitude * snoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// ========== HSL to RGB ==========
vec3 hsl2rgb(float h, float s, float l) {
  vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
}

// ========== SHAPE FUNCTIONS ==========
// Rounded Cone SDF by Inigo Quilez
// Adapted to create a teardrop: r1 = bottom radius, r2 = top radius (small for sharp), h = height
float sdRoundedCone(vec2 p, float r1, float r2, float h) {
    vec2 q = vec2(length(p.x), p.y);
    float b = (r1 - r2) / h;
    float a = sqrt(1.0 - b * b);
    float k = dot(q, vec2(-b, a));
    
    if (k < 0.0) return length(q) - r1;
    if (k > a * h) return length(q - vec2(0.0, h)) - r2;
    return dot(q, vec2(a, b)) - r1;
}

// Wrapper to match previous signature and orientation
// r = base radius
float sdDrop(vec2 p, float r) {
    // Shift Y so that the "center" of the blob (r) aligns roughly with the bottom sphere
    // The cone grows UPWARDS from (0,0) in sdRoundedCone logic.
    // Our p is centered. Let's shift p down so the bottom sphere sits at center?
    // Or shift p up so the whole shape is centered?
    
    // Previous logic centered the shape somewhat.
    // Let's position the bottom sphere at y = -r * 0.5 to balance the height.
    p.y += r * 0.5;
    
    // Configure Teardrop dimensions
    float r1 = r;              // Bottom radius
    float r2 = 0.001;          // Top radius (sharp point)
    // Reduced height from 2.3 to 1.8 for even fatter look
    float h = r * 1.8;         
    
    // We want to center the shape.
    // The shape extends from y = -r1 to y = h.
    // The midpoint is (-r1 + h) / 2.
    // We want this midpoint to line up with p.y = 0 (viewport center).
    // So we shift p.y by MINUS midpoint? 
    // No, SDF is f(p). We want f(0) to map to middle.
    // So we pass (midpoint) to the internal logic when p is 0.
    // So p.y += midpoint.
    
    float midY = (h - r1) * 0.5;
    p.y -= midY; // Actually, looking at previous logic...
    // Let's testing:
    // If I use p.y -= midY... at p.y=0 => internal y = -midY.
    // The shape is at [ -r1, h ]. midY is center.
    // If internal y is -midY... that's below the shape center?
    // Wait.
    // Let's stick to the standard: To translate OBJECT by V, change coord p to p - V.
    // We want to translate the object such that its center (midY) moves to 0.
    // Translation vector V = (0, -midY).  (Move down by midY)
    // So p becomes p - (0, -midY) = p + (0, midY).
    // So p.y += midY.
    
    // BUT wait. sdRoundedCone builds the shape starting at (0,0) going UP to (0,h).
    // And implies a sphere at (0,0). So shape is roughly [-r1, h].
    // Center is (h - r1)/2.
    // To move that center to 0, we need to move the object DOWN by center amount.
    // Object translation -Y means p.y += Y.
    // So p.y += (h - r1) * 0.5.
    
    p.y += (h - r1) * 0.5;
    
    return sdRoundedCone(p, r1, r2, h);
}

// ========== Main ==========
void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 uvAspect = (uv - 0.5) * aspect;
  
  float time = uTime * 0.15;
  
  // ============ TURBULENT LIQUID FLOW (Directionless) ============
  // Replacing linear falling with multi-directional turbulence
  // Layer 1: Base slow turbulence
  vec2 turb1 = vec2(
    snoise(uvAspect * 1.2 + time * 0.2),
    snoise(uvAspect * 1.3 - time * 0.15 + 10.0)
  );
  // Layer 2: Faster detail turbulence
  vec2 turb2 = vec2(
    fbm(uvAspect * 2.5 - time * 0.35, 2),
    fbm(uvAspect * 2.2 + time * 0.3 + 20.0, 2)
  );
  
  vec2 flowOffset = (turb1 * 0.4 + turb2 * 0.2) * 0.5;
  vec2 distortedUv = uvAspect + flowOffset;
  
  // Mouse interaction - ripples
  vec2 mouseUv = (uMouse - 0.5) * aspect;
  float mouseDist = length(uvAspect - mouseUv);
  float mouseInfluence = exp(-mouseDist * 4.0) * 0.15;
  distortedUv += normalize(uvAspect - mouseUv + 0.001) * mouseInfluence * sin(time * 3.0 + mouseDist * 10.0);
  
  // ============ INTERNAL WOBBLE ON MORPH ============
  // Add a "shake" when morphing happens (triggered by uScrollProgress)
  // Use scroll progress rate or just sinusoidal shake based on progress
  float wobbleIntensity = sin(uScrollProgress * PI) * 0.1; // Peak wobble at 50% scroll
  vec2 wobble = vec2(
    sin(time * 5.0 + uScrollProgress * 10.0),
    cos(time * 4.0 + uScrollProgress * 8.0)
  ) * wobbleIntensity;
  distortedUv += wobble;
  
  // ============ RAINBOW GRADIENT (Seamless Fix) ============
  float angle1 = atan(distortedUv.y, distortedUv.x);
  float angle2 = atan(distortedUv.y, -distortedUv.x);
  
  float h1 = angle1 / (2.0 * PI) + 0.5;
  float h2 = fract(angle2 / (2.0 * PI) + 1.0);
  
  float hueShift1 = fbm(distortedUv * 1.2 + time * 0.2, 2) * 0.3;
  float hueShift2 = snoise(distortedUv * 2.0 - time * 0.15) * 0.2;
  
  float satNoise = snoise(distortedUv * 1.5 + time * 0.1);
  float saturation = 0.5 + satNoise * 0.2; 
  float lightNoise = snoise(distortedUv * 1.5 - time * 0.12);
  float lightness = 0.65 + lightNoise * 0.15; 
  
  vec3 c1 = hsl2rgb(fract(h1 + hueShift1 + hueShift2 + time * 0.05), saturation, lightness);
  vec3 c2 = hsl2rgb(fract(h2 + hueShift1 + hueShift2 + time * 0.05), saturation, lightness);
  
  float blend = smoothstep(0.85, 1.0, abs(angle1) / PI);
  vec3 rainbowColor = mix(c1, c2, blend);
  
  // ============ LIQUID FLOW PATTERN ============
  float flow1 = snoise(distortedUv * 2.0 + time * 0.2) * 0.5 + 0.5;
  float flow2 = snoise(distortedUv * 1.5 - time * 0.15 + 50.0) * 0.5 + 0.5;
  float liquidPattern = smoothstep(0.15, 0.55, flow1 * flow2);
  
  // ============ IRIDESCENT PEARL EFFECT ============
  float iridescence = snoise(distortedUv * 6.0 + time * 0.25) * 0.6;
  vec3 pearlColor = mix(
    hsl2rgb(fract(h1 + iridescence * 0.1), saturation * 0.3, 0.95),
    hsl2rgb(fract(h2 + iridescence * 0.1), saturation * 0.3, 0.95),
    blend
  );
  float pearlIntensity = pow(abs(snoise(distortedUv * 3.0 + time * 0.2)), 1.5) * 0.5;
  
  // ============ SPECULAR HIGHLIGHTS ============
  float specular = snoise(distortedUv * 4.0 + time * 0.35);
  specular = pow(max(0.0, specular * specular), 3.0) * 1.5;
  
  // ============ SHAPE MORPHING (Blob to Teardrop) ============
  // CRITICAL: useSpring can overshoot > 1.0. 
  // We clamp morphProgress so the shape definition stops at the perfect teardrop.
  float morphProgress = clamp(uScrollProgress, 0.0, 1.0);
  // Optional easing for morph
  morphProgress = smoothstep(0.0, 1.0, morphProgress);
  
  // 1. Initial State: Noisy Blob
  // Calculate polar coordinates for noise
  float dist = length(uvAspect);
  float angle = atan(uvAspect.y, uvAspect.x);
  vec2 seamCoord = vec2(cos(angle), sin(angle));
  
  float shapeMorph = snoise(seamCoord * 0.8 + time * 0.1) * 0.05;
  float detailMorph = snoise(seamCoord * 2.5 - time * 0.2) * 0.04;
  
  // Dynamic waves - reduce amplitude as we scroll to smooth out
  float waveStrength = mix(1.0, 0.05, morphProgress);
  float wave1 = sin(angle * 4.0 + time * 0.5 + shapeMorph * 10.0) * 0.03 * waveStrength;
  float wave2 = sin(angle * 6.0 - time * 0.4 + detailMorph * 5.0) * 0.02 * waveStrength;
  
  // Dynamic Radius: Shrink from 0.45 to 0.18 (adjusted size)
  float baseRadius = mix(0.42, 0.18, morphProgress);
  
  // Blob Radius calculation
  float blobRadius = baseRadius + (shapeMorph + detailMorph) * waveStrength + wave1 + wave2;
  // Clamp radius for stability, but tighten clamp as we shrink
  blobRadius = clamp(blobRadius, baseRadius * 0.8, baseRadius * 1.2);
  
  // Distance field logic for Blob state
  float blobDist = dist - blobRadius;
  
  // 2. Target State: Smooth Teardrop
  // Calculate SDF for Teardrop, centered
  vec2 dropUV = uvAspect;
  
  // ============ GLOBAL BOUNCE (Framer Motion) ============
  // If uScrollProgress > 1.0 (Overshoot), we apply a global "Jelly Scale".
  // This affects the coordinate space of the DROP only.
  float overshoot = uScrollProgress - 1.0;
  
  if (uScrollProgress > 0.95 && abs(overshoot) > 0.001) {
      // Squash and Stretch based on overshoot
      // Overshoot > 0 (Impact): Squash Y (make it fatter/shorter)
      // scale.y < 1.0 -> means object spans MORE uv space -> object looks TALLER?
      // Wait. uv * 0.9 -> texture is zoomed IN -> Object looks BIGGER.
      // uv * 1.1 -> texture is zoomed OUT -> Object looks SMALLER.
      
      // We want Squash (Shorter Y, Wider X) when Overshoot > 0 (hitting bottom).
      // Shorter Y -> Object occupies LESS screen space -> Multiplier > 1.0.
      // Amplified strength for user visibility (was 3.0 -> 4.0)
      float sy = 1.0 + overshoot * 4.0; 
      float sx = 1.0 - overshoot * 2.0; 
      
      // ROTATIONAL WOBBLE (The "Arc" feel)
      // Tilt the shape based on the overshoot to give a "jell-o" shake
      float tiltAngle = overshoot * -2.0; // Angle proportional to impact
      float c = cos(tiltAngle);
      float s = sin(tiltAngle);
      mat2 rot = mat2(c, -s, s, c);
      
      // Apply Scale CENTERED
      // (scale around 0,0 which is the visual center now)
      dropUV.y *= sy;
      dropUV.x *= sx;
      
      // Apply Rotation
      dropUV = rot * dropUV;
      
      // Inject extra lateral wobble for that "shaking jelly" feel
      distortedUv.x += sin(overshoot * 20.0) * 0.02;
  }
  
  // Teardrop SDF
  float dropSDF = sdDrop(dropUV, baseRadius); 
  
  // 3. Mix Shapes
  // We use the scroll progress to blend between the "Blob Distance" and "Teardrop Distance"
  float finalSDF = mix(blobDist, dropSDF, morphProgress);
  
  // Smooth edges
  float edgeWidth = 0.01;
  float blob = 1.0 - smoothstep(0.0, edgeWidth, finalSDF);
  
  // ============ COMPOSE ==========
  vec3 finalColor = rainbowColor;
  finalColor = mix(finalColor, rainbowColor * 1.2, liquidPattern * 0.3);
  finalColor = mix(finalColor, pearlColor, pearlIntensity);
  finalColor += vec3(1.0, 0.98, 0.95) * specular;
  
  float edgeGlow = smoothstep(blobRadius, blobRadius - 0.15, dist);
  finalColor += rainbowColor * 0.2 * (1.0 - edgeGlow) * blob;
  
  // ============ BACKGROUND ============
  vec3 bgColor = vec3(0.97, 0.96, 0.95);
  finalColor = mix(bgColor, finalColor, blob);
  
  // Fix: When blob is 0, we want background. 
  // Vignette adds nice touch but let's keep it simple.
  float vignette = 1.0 - dot(uvAspect * 0.8, uvAspect * 0.8);
  finalColor *= 0.9 + vignette * 0.1;
  
  gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
}

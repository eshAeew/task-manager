import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { motion } from "framer-motion";
import { Sparkles, MousePointer, Volume2, VolumeX, RotateCcw, RefreshCw } from "lucide-react";

export default function FidgetToys() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center flex items-center justify-center">
        <Sparkles className="mr-2 h-6 w-6" />
        Fidget Toys
      </h1>
      
      <Tabs defaultValue="bubble-wrap" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bubble-wrap">Bubble Wrap</TabsTrigger>
          <TabsTrigger value="spinner">Fidget Spinner</TabsTrigger>
          <TabsTrigger value="liquid">Liquid Simulator</TabsTrigger>
          <TabsTrigger value="stress-ball">Stress Ball</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bubble-wrap" className="mt-6">
          <BubbleWrap />
        </TabsContent>
        
        <TabsContent value="spinner" className="mt-6">
          <FidgetSpinner />
        </TabsContent>
        
        <TabsContent value="liquid" className="mt-6">
          <LiquidSimulator />
        </TabsContent>
        
        <TabsContent value="stress-ball" className="mt-6">
          <StressBall />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Bubble Wrap Component
function BubbleWrap() {
  const [poppedBubbles, setPoppedBubbles] = useState<Set<string>>(new Set());
  const [sound, setSound] = useState(true);
  
  const popBubble = (id: string) => {
    if (!poppedBubbles.has(id)) {
      const newPopped = new Set(poppedBubbles);
      newPopped.add(id);
      setPoppedBubbles(newPopped);
      
      if (sound) {
        const audio = new Audio("data:audio/wav;base64,UklGRjQnAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YRAn");
        audio.volume = 0.3;
        audio.play().catch(e => console.error("Audio play failed:", e));
      }
    }
  };
  
  const resetBubbles = () => {
    setPoppedBubbles(new Set());
  };
  
  const renderBubbles = () => {
    const bubbles = [];
    const rows = 8;
    const cols = 10;
    
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const id = `${i}-${j}`;
        const isPopped = poppedBubbles.has(id);
        
        bubbles.push(
          <div 
            key={id}
            className={`w-12 h-12 rounded-full m-1 shadow-md cursor-pointer transition-all duration-200 flex items-center justify-center select-none
                      ${isPopped ? 'bg-gray-200 opacity-50' : 'bg-blue-100 hover:bg-blue-200'}`}
            onClick={() => popBubble(id)}
            style={{ 
              boxShadow: isPopped ? 'none' : '0 2px 4px rgba(0,0,0,0.1), inset 2px 2px 4px rgba(255,255,255,0.8)',
              transform: isPopped ? 'scale(0.8)' : 'scale(1)' 
            }}
          >
            {!isPopped && <div className="w-4 h-4 rounded-full bg-white opacity-60 transform -translate-x-1 -translate-y-1"></div>}
          </div>
        );
      }
    }
    
    return bubbles;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Virtual Bubble Wrap</CardTitle>
        <CardDescription>
          Pop the bubbles to release stress. Pop them all for maximum satisfaction!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-between items-center">
          <Button onClick={resetBubbles} variant="outline" size="sm">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset All
          </Button>
          <Button 
            onClick={() => setSound(!sound)} 
            variant="ghost" 
            size="sm"
            className={sound ? "text-green-600" : "text-gray-400"}
          >
            {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {sound ? "Sound On" : "Sound Off"}
          </Button>
        </div>
        
        <div className="flex flex-wrap justify-center p-4 bg-gray-50 rounded-lg">
          {renderBubbles()}
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Popped: {poppedBubbles.size} / 80 bubbles
        </div>
      </CardContent>
    </Card>
  );
}

// Fidget Spinner Component
function FidgetSpinner() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinSpeed, setSpinSpeed] = useState(5);
  const [spinnerColor, setSpinnerColor] = useState("#4f46e5");
  
  const handleSpin = () => {
    setIsSpinning(true);
    
    // Auto stop after some time based on speed
    const duration = 15000 / spinSpeed;
    setTimeout(() => {
      setIsSpinning(false);
    }, duration);
  };
  
  const colors = ["#4f46e5", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6"];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fidget Spinner</CardTitle>
        <CardDescription>
          Click to spin. Adjust speed and color to your liking.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <span className="w-24 text-sm text-gray-500">Spin Speed:</span>
            <Slider 
              className="w-64" 
              value={[spinSpeed]} 
              min={1} 
              max={10} 
              step={1}
              onValueChange={(values) => setSpinSpeed(values[0])}
            />
            <span className="ml-2 text-sm">{spinSpeed}</span>
          </div>
          
          <div className="flex items-center">
            <span className="w-24 text-sm text-gray-500">Color:</span>
            <div className="flex gap-2">
              {colors.map(color => (
                <div 
                  key={color}
                  className={`w-6 h-6 rounded-full cursor-pointer ${spinnerColor === color ? 'ring-2 ring-offset-2' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSpinnerColor(color)}
                ></div>
              ))}
            </div>
          </div>
        </div>
        
        <div 
          className="w-52 h-52 relative cursor-pointer flex items-center justify-center mb-6"
          onClick={handleSpin}
        >
          <motion.div 
            className="w-40 h-40 rounded-full relative"
            animate={{ 
              rotate: isSpinning ? 360 * 20 : 0 
            }}
            transition={{ 
              duration: isSpinning ? 15 : 0,
              ease: isSpinning ? "circOut" : "circIn",
              repeatType: "loop",
              repeat: 0
            }}
          >
            {/* Center */}
            <div 
              className="absolute w-12 h-12 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{ backgroundColor: spinnerColor, boxShadow: "0 0 15px rgba(0,0,0,0.2)" }}
            ></div>
            
            {/* Arms */}
            {[0, 120, 240].map((rotation, i) => (
              <div 
                key={i}
                className="absolute w-14 h-14 rounded-full top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                style={{ 
                  backgroundColor: spinnerColor,
                  opacity: 0.8,
                  transformOrigin: "center 7rem",
                  rotate: `${rotation}deg`,
                  top: "50%",
                  left: "50%"
                }}
              ></div>
            ))}
          </motion.div>
          
          {!isSpinning && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-500 flex flex-col items-center">
              <MousePointer className="h-6 w-6" />
              <span className="text-xs mt-1">Click to spin</span>
            </div>
          )}
        </div>
        
        <Button onClick={handleSpin} disabled={isSpinning}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isSpinning ? "animate-spin" : ""}`} />
          {isSpinning ? "Spinning..." : "Spin"}
        </Button>
      </CardContent>
    </Card>
  );
}

// Liquid Simulator Component
function LiquidSimulator() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; vx: number; vy: number; }>>(
    Array.from({ length: 150 }, (_, i) => ({
      id: i,
      x: Math.random() * 300,
      y: Math.random() * 300,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2
    }))
  );
  
  const [gravity, setGravity] = useState(1);
  const [viscosity, setViscosity] = useState(0.5);
  const [color, setColor] = useState("#3b82f6");
  
  const resetSimulation = () => {
    setParticles(
      Array.from({ length: 150 }, (_, i) => ({
        id: i,
        x: Math.random() * 300,
        y: Math.random() * 300,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2
      }))
    );
  };
  
  const handleColorChange = (newColor: string) => {
    setColor(newColor);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liquid Simulator</CardTitle>
        <CardDescription>
          Tilt your device to watch the particles move. Adjust gravity and viscosity to see different effects.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-3">
          <div className="flex items-center">
            <span className="w-24 text-sm text-gray-500">Gravity:</span>
            <Slider 
              className="w-64" 
              value={[gravity]} 
              min={0} 
              max={2} 
              step={0.1}
              onValueChange={(values) => setGravity(values[0])}
            />
            <span className="ml-2 text-sm">{gravity.toFixed(1)}</span>
          </div>
          
          <div className="flex items-center">
            <span className="w-24 text-sm text-gray-500">Viscosity:</span>
            <Slider 
              className="w-64" 
              value={[viscosity]} 
              min={0.1} 
              max={1} 
              step={0.1}
              onValueChange={(values) => setViscosity(values[0])}
            />
            <span className="ml-2 text-sm">{viscosity.toFixed(1)}</span>
          </div>
          
          <div className="flex items-center">
            <span className="w-24 text-sm text-gray-500">Color:</span>
            <ToggleGroup type="single" value={color} onValueChange={(value) => value && handleColorChange(value)}>
              <ToggleGroupItem value="#3b82f6" className="bg-blue-500 w-8 h-8 rounded-full p-0" />
              <ToggleGroupItem value="#10b981" className="bg-green-500 w-8 h-8 rounded-full p-0" />
              <ToggleGroupItem value="#ef4444" className="bg-red-500 w-8 h-8 rounded-full p-0" />
              <ToggleGroupItem value="#f59e0b" className="bg-amber-500 w-8 h-8 rounded-full p-0" />
              <ToggleGroupItem value="#8b5cf6" className="bg-purple-500 w-8 h-8 rounded-full p-0" />
            </ToggleGroup>
          </div>
        </div>
        
        <div className="relative h-72 bg-gray-100 rounded-lg overflow-hidden mb-4">
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Tilt your device or click/tap to interact
          </div>
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              initial={{ 
                x: particle.x, 
                y: particle.y,
                width: 8 + Math.random() * 6,
                height: 8 + Math.random() * 6
              }}
              animate={{ 
                x: [particle.x, particle.x + Math.random() * 300 - 150],
                y: [particle.y, particle.y + Math.random() * (300 * gravity) - 50],
              }}
              transition={{
                duration: 4 - (viscosity * 2),
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse"
              }}
              style={{ backgroundColor: color, opacity: 0.7 + Math.random() * 0.3 }}
            />
          ))}
        </div>
        
        <div className="flex justify-center">
          <Button onClick={resetSimulation} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Simulation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Stress Ball Component
function StressBall() {
  const [squeezed, setSqueezed] = useState(false);
  const [squeezeStrength, setSqueezeStrength] = useState(0);
  const [ballColor, setBallColor] = useState("#f87171");
  
  const handleMouseDown = () => {
    setSqueezed(true);
  };
  
  const handleMouseUp = () => {
    setSqueezed(false);
    setSqueezeStrength(0);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (squeezed) {
      // Calculate squeeze strength based on mouse movement
      const rect = e.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      const maxDistance = rect.width / 2;
      
      // Normalize to 0-100
      const normalizedStrength = Math.min(100, (distance / maxDistance) * 100);
      setSqueezeStrength(normalizedStrength);
    }
  };
  
  const colorOptions = [
    { name: "Red", value: "#f87171" },
    { name: "Blue", value: "#60a5fa" },
    { name: "Green", value: "#4ade80" },
    { name: "Yellow", value: "#fbbf24" },
    { name: "Purple", value: "#a78bfa" },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Virtual Stress Ball</CardTitle>
        <CardDescription>
          Press and hold to squeeze the stress ball. Move around while holding to vary pressure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2 justify-center">
          {colorOptions.map((option) => (
            <Button 
              key={option.value}
              variant="ghost"
              className="p-2"
              onClick={() => setBallColor(option.value)}
            >
              <div
                className="w-6 h-6 rounded-full mr-2"
                style={{ backgroundColor: option.value }}
              ></div>
              {option.name}
            </Button>
          ))}
        </div>
        
        <div className="flex justify-center items-center h-72 bg-gray-50 rounded-lg">
          <motion.div
            className="rounded-full"
            style={{ 
              backgroundColor: ballColor,
              boxShadow: "inset 0 0 20px rgba(0,0,0,0.2), 0 0 30px rgba(0,0,0,0.1)"
            }}
            animate={{ 
              width: squeezed ? `${Math.max(160 - squeezeStrength, 100)}px` : "160px",
              height: squeezed ? `${Math.max(160 - squeezeStrength * 0.3, 140)}px` : "160px",
              borderRadius: "50%",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
          >
            <div className="h-full w-full flex items-center justify-center relative overflow-hidden">
              <motion.div
                className="absolute rounded-full bg-white opacity-30"
                animate={{ 
                  width: squeezed ? "30%" : "40%",
                  height: squeezed ? "20%" : "30%",
                  x: squeezed ? "-15%" : "-20%",
                  y: squeezed ? "-25%" : "-30%",
                }}
              />
            </div>
          </motion.div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Squeeze pressure: {squeezeStrength.toFixed(0)}%
          </div>
          <div className="text-sm text-gray-500">
            {squeezed ? "Squeezing..." : "Click and hold to squeeze"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
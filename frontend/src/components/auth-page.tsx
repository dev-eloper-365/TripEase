'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'

const features = [
  "Plan your dream vacation",
  "Discover hidden gems",
  "Connect with fellow travelers",
  "Customize your itinerary"
]

export function AuthPageComponent() {
  const { toast } = useToast();
  const router = useRouter();

  //login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  //signup states
  const [firstName, setFirstname] = useState("");
  const [lastName, setLastname] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signipEmail, setSignupEmail] = useState("");

  const [featureIndex, setFeatureIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  
  async function Login(){
    await fetch("https://tripease-2alb.onrender.com/user/login", {
      method: "POST",
      body: JSON.stringify({
        email: email,
        password: password
      }),
      headers: {
        "Content-Type": "application/json"
      }
    }).then((res) => {
      res.json().then((data) => {
        localStorage.setItem('token', data.token);
        if(data.status !== 200){
          // console.log(data.message);
          if(data.message.message){
            toast({
              title: "error",
              description: data.message.message,
              variant: 'destructive'
            })
          }
          else{
            toast({
              title: "error",
              description: data.message,
              variant: 'destructive'
            })
          }
        }
        else{
          
          router.push("/plan");
        }
      })
    })
  }

  async function Signup(){
    await fetch("https://tripease-2alb.onrender.com/user/signup", {
      method: "POST",
      body: JSON.stringify({
        firstName: firstName,
        lastName: lastName,
        email: signipEmail,
        password: signupPassword
      }),
      headers: {
        "Content-Type": "application/json"
      }
    }).then((res) => {
      res.json().then((data) => {
        localStorage.setItem('token', data.token);
        if(data.status !== 200){
          if(data.message.message){
            toast({
              title: "error",
              description: data.message.message,
              variant: 'destructive'
            })
          }
          else {
            toast({
              title: "error",
              description: data.message,
              variant: 'destructive'
            })
          }
        }
        else{
          router.push("/plan");
        }
      })
    })
  }

  // typewriter effect
  useEffect(() => {
    const feature = features[featureIndex]
    let i = 0
    const typingInterval = setInterval(() => {
      if (i < feature.length) {
        setDisplayText(feature.substring(0, i + 1))
        i++
      } else {
        clearInterval(typingInterval)
        setTimeout(() => {
          setFeatureIndex((prevIndex) => (prevIndex + 1) % features.length)
        }, 2000) // Wait 2 seconds before starting the next feature
      }
    }, 100) // Adjust typing speed here

    return () => clearInterval(typingInterval)
  }, [featureIndex])

  return (
    <div className="min-h-screen bg-black text-[#F2F2F2] flex flex-col md:flex-row">
      {/* Left partition */}
      <div className="md:w-1/2 bg-black text-[#F2F2F2] p-8 flex flex-col justify-center items-center border-r border-[#ffffff1a]">
        <h1 className="text-4xl font-bold mb-6">TripEase</h1>
        <div className="h-16 text-xl text-center text-[#F2F2F2] typewriter-text">
          {displayText}
        </div>
      </div>

      {/* Right partition */}
      <div className="md:w-1/2 flex items-center justify-center p-8 bg-black">
        <div className="w-full max-w-md">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-black border border-[#ffffff1a]">
              <TabsTrigger 
                value="login" 
                className="text-[#F2F2F2] data-[state=active]:bg-[#ffffff0a] data-[state=active]:text-[#F2F2F2]"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="signup"
                className="text-[#F2F2F2] data-[state=active]:bg-[#ffffff0a] data-[state=active]:text-[#F2F2F2]"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <div className="space-y-4 bg-black p-6 rounded-lg border border-[#ffffff1a]">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-[#F2F2F2]">Email</Label>
                  <Input 
                    id="login-email" 
                    type="email" 
                    placeholder="Enter your email" 
                    className="bg-black border-[#ffffff1a] focus:border-[#ffffff4d] text-[#F2F2F2] placeholder:text-[#666666]"
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-[#F2F2F2]">Password</Label>
                  <Input 
                    id="login-password" 
                    type="password" 
                    placeholder="Enter your password" 
                    className="bg-black border-[#ffffff1a] focus:border-[#ffffff4d] text-[#F2F2F2] placeholder:text-[#666666]"
                    onChange={(e) => {
                      setPassword(e.target.value);
                    }}
                  />
                </div>
                <Button 
                  className="w-full bg-transparent hover:bg-[#ffffff0a] border border-[#ffffff1a] text-[#F2F2F2]" 
                  onClick={Login}
                >
                  Log In
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="signup">
              <div className="space-y-4 bg-black p-6 rounded-lg border border-[#ffffff1a]">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstname" className="text-[#F2F2F2]">First Name</Label>
                    <Input 
                      id="firstname" 
                      placeholder="Enter first name" 
                      className="bg-black border-[#ffffff1a] focus:border-[#ffffff4d] text-[#F2F2F2] placeholder:text-[#666666]"
                      onChange={(e) => {
                        setFirstname(e.target.value);
                      }} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastname" className="text-[#F2F2F2]">Last Name</Label>
                    <Input 
                      id="lastname" 
                      placeholder="Enter last name" 
                      className="bg-black border-[#ffffff1a] focus:border-[#ffffff4d] text-[#F2F2F2] placeholder:text-[#666666]"
                      onChange={(e) => {
                        setLastname(e.target.value);
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-[#F2F2F2]">Email</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="Enter your email" 
                    className="bg-black border-[#ffffff1a] focus:border-[#ffffff4d] text-[#F2F2F2] placeholder:text-[#666666]"
                    onChange={(e) => {
                      setSignupEmail(e.target.value);
                    }} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-[#F2F2F2]">Password</Label>
                  <Input 
                    id="signup-password" 
                    type="password" 
                    placeholder="Create a password" 
                    className="bg-black border-[#ffffff1a] focus:border-[#ffffff4d] text-[#F2F2F2] placeholder:text-[#666666]"
                    onChange={(e) => {
                      setSignupPassword(e.target.value);
                    }}
                  />
                </div>
                <Button 
                  className="w-full bg-transparent hover:bg-[#ffffff0a] border border-[#ffffff1a] text-[#F2F2F2]" 
                  onClick={Signup}
                >
                  Sign Up
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
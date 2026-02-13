import Modal from "./components/Modal"
import Navbar from "./components/Navbar"

export default function Home() {
    return (
        <div>
            <Navbar/>
            <header className="w-full p-20 text-center bg-blue-900">
                <h1 className="text-8xl mb-10 font-bold" style={{fontSize:"40px"}}>Welcome to Pawsite!</h1>
                <h3 className="mt-10">We provide care for pet owners!</h3>
            </header>
            <main className="w-full p-20 text-center">
                <h1 className="mb-10" style={{fontSize:"40px"}}>What we offer</h1>
                <div className="grid grid-cols-2 gap-4">
                    <Modal 
                        title = "Pet Services"
                        body = "We provide one of the best pet services we can ever do in Singapore!"
                        imgUrl = {"./file.svg"}
                    />
                    <Modal 
                        title = "Care Consulting"
                        body = "We provide the best care consultation services for pets and pet owners!"
                        imgUrl = {"./window.svg"}
                    />
                    <Modal 
                        title="Location Finder"
                        body = "With the most modern technologies we have, we can accurately identify the best locations for you to play with your pets!"
                        imgUrl = {"./globe.svg"}
                    />
                    <Modal 
                        title="Pet Rescuer"
                        body = "We have a function that would help you rescue your pets!"
                        imgUrl = {"./globe.svg"}
                    />
                </div>
            </main>
            <footer className="p-5 bg-emerald-900">
                <h1 className="text-center font-bold">Contact us here! We won't bite :)</h1>
                <div className="flex w-full justify-between">
                    <div className="p-10">
                        <h3>Find us on</h3>
                        <div className="flex">
                            <img style={{filter:`invert(100%)`,width:"48px"}} src={"./fb.svg"} />
                            <img style={{filter:`invert(100%)`,width:"48px"}} src={"./ig.svg"} />
                            <img style={{filter:`invert(100%)`,width:"48px"}} src={"./x.svg"} />
                        </div>
                    </div>
                    <div className="p-10">
                        <h3>Contact Us</h3>
                        <div className="flex">
                            <img style={{filter:`invert(100%)`,width:"48px"}} src={"./wa.svg"} />
                            <img style={{filter:`invert(100%)`,width:"48px"}} src={"./email.svg"} /> 
                        </div>
                    </div>
                </div>
                <p className="text-center">&copy; 2026 All Rights Reserved</p>
            </footer>
        </div>
    )
}
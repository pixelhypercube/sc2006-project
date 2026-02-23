import Modal from "./components/Modal"
import Navbar from "./components/Navbar"
import SideModal from "./components/SideModal"

export default function Home() {
    return (
        <div>
            <Navbar/>
            <header className="w-full p-20 text-center bg-secondary">
                <h1 className="text-8xl mb-10 font-bold">Pawsport & Peer</h1>
                <h3 className="mt-10 text-2xl">Providing care for pet owners since 2026</h3>
            </header>
            <main className="w-full p-20 text-center">
                <div className="mb-10">
                    <h1 className="mb-10 font-bold" style={{fontSize:"40px"}}>What we offer</h1>
                    <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-10 mb-10">
                        <Modal 
                            title = "Pet Services"
                            body = "Stay connected with your pet through 10-15 second video check-ins. Our secure, time-limited links ensure you get real-time evidence of care without compromising privacy."
                            imgUrl = {"./modal/paw.svg"}
                            // inverseImg={true}
                        />
                        <Modal 
                            title = "Behavioral Blueprints"
                            body = "Create a detailed behavioural blueprint for your pet, including specific triggers, dietary sensitivities, and care notes to ensure your peer caregiver is fully prepared."
                            imgUrl = {"./modal/location_pin.svg"}
                            // inverseImg={true}
                        />
                        <Modal 
                            title="Smart Logistics Matching"
                            body = "Find the perfect local caregiver using our intelligent matching engine. We factor in proximity, local weather conditions, and nearby veterinary facilities to ensure a safe environment."
                            imgUrl = {"./modal/send.svg"}
                            // inverseImg={true}
                        />
                        <Modal 
                            title="Privacy & Data Expiry"
                            body = "Your privacy is our priority. We utilize automated data retention policies that expire video evidence after the care period, keeping your media off messaging platforms and on our secure, temporary storage."
                            imgUrl = {"./modal/shield_exclaimation.svg"}
                            // inverseImg={true}
                        />
                    </div>
                </div>
                <div>
                    <h1 className="text-4xl font-bold mb-10">How it works</h1>
                    <SideModal
                        imgUrl={"./side_modals/blueprint.svg"}
                        title="Step 1: Create a Blueprint"
                        description="Tell the system about your pet's needs"
                    />
                    <SideModal
                        imgUrl={"./side_modals/magnifying_glass.svg"}
                        title="Step 2: Match & Request"
                        description="Find a caregiver and send a time-limited check-in request."
                    />
                    <SideModal
                        imgUrl={"./side_modals/camera.svg"}
                        title="Step 3: Secure Upload"
                        description="The caregiver uploads a 10-15s video via a one-time link"
                    />
                    <SideModal
                        imgUrl={"./side_modals/heart.svg"}
                        title="Step 4: Peace of Mind"
                        description="Review the evidence and approve the care."
                    />
                </div>
                <div className="mb-10">
                    <h1 className="text-4xl font-bold mb-10">Testimonials</h1>
                    <Modal 
                        title="Amazing service!"
                        background={"#eeffcc"}
                        body = "Thanks to this system, we are able to take care of our pets easily! - Jessica"
                    />
                </div>
                <div className="mb-10">
                    <h1 className="text-4xl font-bold mb-10">Frequently Asked Questions (FAQ)</h1>
                    <SideModal
                        imgUrl={"./side_modals/heart.svg"}
                        title="How do you match and request caregivers?"
                        description="Use our search caregivers functions to search for one of our highly trained caregivers for your pets!"
                    />
                </div>
                <div>
                    <h1 className="text-4xl font-bold mb-10">Join Us Now!</h1>
                    <a className="bg-secondary p-3 rounded-2xl shadow-xl font-bold text-xl" href="/signup">Sign Up</a>
                </div>
            </main>
            <footer className="p-5 bg-[#68B0AB]">
                <h1 className="text-center font-semibold text-3xl">Contact us here! We won't bite :)</h1>
                <div className="flex w-full justify-between">
                    <div className="p-10">
                    <h3 className="text-xl">Find us on</h3>
                        <div className="flex">
                            <img style={{width:"48px"}} src={"./social/fb.svg"} />
                            <img style={{width:"48px"}} src={"./social/ig.svg"} />
                            <img style={{width:"48px"}} src={"./social/x.svg"} />
                        </div>
                    </div>
                    <div className="p-10">
                        <h3 className="text-xl">Contact Us</h3>
                        <div className="flex">
                            <img style={{width:"48px"}} src={"./social/wa.svg"} />
                            <img style={{width:"48px"}} src={"./social/email.svg"} /> 
                        </div>
                    </div>
                </div>
                <p className="text-center">&copy; 2026 All Rights Reserved</p>
            </footer>
        </div>
    )
}
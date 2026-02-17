interface NavbarComponents {
    leftLinks?: Record<string, string>,
    middleLinks?: Record<string, string>,
    rightLinks?: Record<string, string>,
    background?: string,
}

export default function Navbar({
    leftLinks = {
        "Pawsport & Peer" : "/",
    },
    middleLinks = {
        "Search Caregivers": "/search_caregivers",
        "Pet Profile": "/pet_profile",
        "Incident Reporting": "/incident_reporting"
    },
    rightLinks = {
        "Sign Up" : "/signup"
    },
    background="#FFFFFF"
} : NavbarComponents) {
    return (
        <nav style={{background}} className={`sticky top-0 flex w-full justify-between z-10`}>
            <div className="flex w-1/3 justify-center">
                {Object.keys(leftLinks).map(key=>(
                    <ul className="p-3 text-lg" key={key}><a href={leftLinks[key]}>{key}</a></ul>
                ))}
            </div>
            <div className="flex w-1/3 justify-center">
                {Object.keys(middleLinks).map(key=>(
                    <ul className="p-3 text-lg" key={key}><a href={leftLinks[key]}>{key}</a></ul>
                ))}
            </div>
            <div className="flex w-1/3 justify-center">
                {Object.keys(rightLinks).map(key=>(
                    <ul className="p-3 text-lg" key={key}><a href={rightLinks[key]}>{key}</a></ul>
                ))}
            </div>
        </nav>
    )
}
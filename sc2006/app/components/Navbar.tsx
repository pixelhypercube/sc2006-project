interface NavbarComponents {
    leftLinks?: Record<string, string>,
    rightLinks?: Record<string, string>,
    backgroundColor?: string,
}

export default function Navbar({
    leftLinks = {
        "Home" : "/",
        "About Us": "/about"
    },
    rightLinks = {
        "Signup" : "/signup"
    },
    backgroundColor="#1e2b52"
} : NavbarComponents) {
    return (
        <nav style={{backgroundColor}} className={`sticky top-0 flex w-full justify-between`}>
            <div className="flex w-half">
                {Object.keys(leftLinks).map(key=>(
                    <ul className="p-3 text-xl" key={key}><a href={leftLinks[key]}>{key}</a></ul>
                ))}
            </div>
            <div className="flex w-half">
                {Object.keys(rightLinks).map(key=>(
                    <ul className="p-3 text-xl" key={key}><a href={rightLinks[key]}>{key}</a></ul>
                ))}
            </div>
        </nav>
    )
}
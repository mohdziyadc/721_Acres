const Search = () => {
    return (
        <header>
            <h2 className="header__title">
                Search it.{" "}
                <span className=" bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
                    Explore it.
                </span>{" "}
                Buy it.
            </h2>
            <input
                type="text"
                className="header__search"
                placeholder="Enter an address, neighborhood, city, or ZIP code"
            />
        </header>
    )
}

export default Search

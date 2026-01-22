import React, { Fragment, useState } from 'react'
import "./Search.css"
import MetaData from "../layout/MetaData"
import { useNavigate } from 'react-router-dom'

const Search = () => {
    const [keyword, setKeyword] = useState("")
    const navigate = useNavigate();

    const searchSubmitHandler = (e) => {
        e.preventDefault()
        if (keyword.trim()) {
            navigate(`/products/${keyword}`)
        } else {
            navigate(`/products`)
        }
    }
    return (
        <Fragment>
            <MetaData title="Search a Product" />
            <form className='searchBox' onSubmit={searchSubmitHandler}>
                <input
                    type="text"
                    placeholder="Search products..."
                    aria-label="Search products" // Added for accessibility
                    onChange={(e) => setKeyword(e.target.value)}
                />
                <input type="submit" value="Search" className="primary-btn" style={{ width: 'auto', padding: '0 2rem', height: '60px' }} />
            </form>
        </Fragment>
    )
}

export default Search
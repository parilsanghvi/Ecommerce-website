import React, { Fragment, useState } from 'react'
import "./Search.css"
import MetaData from "../layout/MetaData"
import { useNavigate } from 'react-router-dom'
import SearchIcon from '@mui/icons-material/Search'

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
                    autoFocus
                    onChange={(e) => setKeyword(e.target.value)}
                />
                <button type="submit" className="primary-btn" style={{ width: 'auto', padding: '0 2rem', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <SearchIcon />
                    Search
                </button>
            </form>
        </Fragment>
    )
}

export default Search
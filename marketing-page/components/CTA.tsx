// Centered CTA component for the marketing page
import React from 'react'
import Button from '@mui/material/Button'

export default function CTA() {
    return (
        <Button variant="contained" size="large" color="secondary" href="/" sx={{ mt: 4, position: 'centered', zIndex: 1 }}>
            Get started
        </Button>
    );
}
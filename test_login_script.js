const mockLogin = async () => {
    try {
        const response = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });

        try {
            const text = await response.text();
            console.log('Raw Response:', text.substring(0, 200)); // First 200 chars

            try {
                const data = JSON.parse(text);
                if (response.ok) {
                    console.log('Login Successful!');
                } else {
                    console.log('Login Failed:', data.message);
                }
            } catch (e) {
                console.log('Not JSON. likely 404 or HTML error.');
            }

        } catch (err) {
            console.error('Network Error:', err.message);
        }
    } catch (err) {
        console.error('Network Error:', err.message);
    }
};

mockLogin();

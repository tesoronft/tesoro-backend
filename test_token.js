
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client('ANY_CLIENT_ID');

const brokenToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg2MzBhNzFiZDZlYzFjNjEyNTdhMjdmZjJlZmQ5MTg3MmVjYWIxZjYiLCJ0eXAiOiJKV1QifQeyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0OTg0MDY0OTAyMzgtbHE0MDkxaTFtdjVwOHQwYTFhZGUxcGdrMDNoMGo4NTkuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0OTg0MDY0OTAyMzgtb291Y2lmdDlsbDZxMTJpZWhvaTg5cmVscGduc2t1bzQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDc0NzcxNTI0OTc3MzkzNDYxMTUiLCJoZCI6InN1cGVyaW9yLmVkdS5wayIsImVtYWlsIjoiYmNzbS1mMjEtMjU2QHN1cGVyaW9yLmVkdS5wayIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiTXVoYW1tYWQgUm9zaGFhbiBLaGFuIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0xiSG1zMHI0TEVDNGlhbjZMNVBSV3NSY2NzVnl4b0JjQlVZcXIzZkxLMHF5cW9jQT1zOTYtYyIsImdpdmVuX25hbWUiOiJNdWhhbW1hZCIsImZhbWlseV9uYW1lIjoiUm9zaGFhbiBLaGFuIiwiaWF0IjoxNzY5NjY0MTgyLCJleHAiOjE3Njk2Njc3ODJ9.FNrwTSUiaYD9v8NwR2gyZsQWPF4AykhIzMpQJrp3aW6opCKCypejwrhmgvXPCDCguO1j3dk2HoGHlyRrxO4fNbLP-Qt-NwQpAN2gS8Y5sCuZ3a1bEHkXY04U4SQmmrjNqEi0hOVQVqYvwB6r42k3JwnELZhE1UUIvUJ_EOBTltWAGQ0TOK3yY0hFj__YtZEHKLRXXvoeM8fgnslGYXL12-SGIeQzJ-Qe4V63miJel79d1uQnjFDktZbJ12YsA26wW_7o8GiWVOiFy2HzT0nwr1CUe_FvIeSunuYL5MaY5LPiSIZcU3COXQxp_PxUqGE37uGe8NHYAsCjzbsZMZiEuQ";

// I will insert the dot to see if it makes it valid structure-wise
const part1 = "eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg2MzBhNzFiZDZlYzFjNjEyNTdhMjdmZjJlZmQ5MTg3MmVjYWIxZjYiLCJ0eXAiOiJKV1QifQ";
const part2 = "eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0OTg0MDY0OTAyMzgtbHE0MDkxaTFtdjVwOHQwYTFhZGUxcGdrMDNoMGo4NTkuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0OTg0MDY0OTAyMzgtb291Y2lmdDlsbDZxMTJpZWhvaTg5cmVscGduc2t1bzQuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDc0NzcxNTI0OTc3MzkzNDYxMTUiLCJoZCI6InN1cGVyaW9yLmVkdS5wayIsImVtYWlsIjoiYmNzbS1mMjEtMjU2QHN1cGVyaW9yLmVkdS5wayIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiTXVoYW1tYWQgUm9zaGFhbiBLaGFuIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0xiSG1zMHI0TEVDNGlhbjZMNVBSV3NSY2NzVnl4b0JjQlVZcXIzZkxLMHF5cW9jQT1zOTYtYyIsImdpdmVuX25hbWUiOiJNdWhhbW1hZCIsImZhbWlseV9uYW1lIjoiUm9zaGFhbiBLaGFuIiwiaWF0IjoxNzY5NjY0MTgyLCJleHAiOjE3Njk2Njc3ODJ9";
const part3 = "FNrwTSUiaYD9v8NwR2gyZsQWPF4AykhIzMpQJrp3aW6opCKCypejwrhmgvXPCDCguO1j3dk2HoGHlyRrxO4fNbLP-Qt-NwQpAN2gS8Y5sCuZ3a1bEHkXY04U4SQmmrjNqEi0hOVQVqYvwB6r42k3JwnELZhE1UUIvUJ_EOBTltWAGQ0TOK3yY0hFj__YtZEHKLRXXvoeM8fgnslGYXL12-SGIeQzJ-Qe4V63miJel79d1uQnjFDktZbJ12YsA26wW_7o8GiWVOiFy2HzT0nwr1CUe_FvIeSunuYL5MaY5LPiSIZcU3COXQxp_PxUqGE37uGe8NHYAsCjzbsZMZiEuQ";

const fixedToken = part1 + "." + part2 + "." + part3;

async function verify(token) {
    try {
        console.log("----------------------------------------------------------------");
        console.log("Testing token with split length: " + token.split('.').length);
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: '498406490238-lq4091i1mv5p8t0a1ade1pgk03h0j859.apps.googleusercontent.com', // from the decoded payload in user message
        });
        console.log("Success! Payload: ", ticket.getPayload());
    } catch (e) {
        console.log("Caught Error: " + e.message);
        // console.log("Full Error: ", e);
    }
}

async function run() {
    await verify(brokenToken);
    await verify(fixedToken);
}

run();

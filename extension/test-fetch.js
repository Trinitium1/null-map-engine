const url = "https://script.google.com/macros/s/AKfycby4xF9a_Ut0JACNsF3p_Wu7TMqe0TqWKvKYnxZ4XeIGLZXto86KkIV_6rE8RM9mB0vr/exec";

fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify([{ action: "verify", discordId: "331295286237198336", extVersion: "1.0" }])
})
.then(res => res.text())
.then(text => console.log("Response:", text))
.catch(err => console.error(err));

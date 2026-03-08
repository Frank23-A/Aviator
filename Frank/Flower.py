import hashlib
import hmac
import time

# Streamlit is required to run this demo. When running via `python Flower.py` you
# will see an import error; instead use `streamlit run Flower.py` or install
# Streamlit in your environment.

try:
    import streamlit as st
except ImportError:
    st = None
    print("Streamlit not found. Install it with `pip install streamlit` "
          "and run this with `streamlit run Flower.py`.")
    # nothing else to do
    raise SystemExit(1)

# Title of the Demo
st.title("🛩️ Aviator Math Logic Demo")
st.write("This demo shows how SHA-256 Hashing determines the crash point.")

# 1. Inputs (The Seeds)
server_seed = st.text_input("Server Seed (Secret)", "random_server_string_123")
client_seed = st.text_input("Client Seed (Public)", "player_seed_abc")

import math

def floor(x):
    return math.floor(x)


def calculate_crash_point(s_seed, c_seed):
    # Combine seeds and create a SHA-256 hash
    combined_hash = hmac.new(s_seed.encode(), c_seed.encode(), hashlib.sha256).hexdigest()
    
    # Take the first 13 characters of the hash (standard practice)
    # Convert hex to decimal
    hex_portion = combined_hash[:13]
    decimal_val = int(hex_portion, 16)
    
    # The Math: Ensure 3% House Edge (RTP 97%)
    # If the hash is divisible by 33 (roughly 3%), it's an instant crash (1.00)
    if decimal_val % 33 == 0:
        return 1.00
    
    # Calculate the multiplier
    # Formula: (2^52 - decimal) / (2^52 - decimal_val)
    # Simplified for demo:
    e = 2**52
    multiplier = (100 * e - decimal_val) / (e - decimal_val)
    return max(1.0, floor(multiplier) / 100)

if st.button('Run Round'):
    crash_point = calculate_crash_point(server_seed, client_seed)
    
    placeholder = st.empty()
    chart_placeholder = st.empty()
    
    current_multiplier = 1.00
    growth_data = []

    # Simulate the plane flying
    while current_multiplier < crash_point:
        growth_data.append(current_multiplier)
        placeholder.metric("Current Multiplier", f"{current_multiplier:.2f}x")
        chart_placeholder.line_chart(growth_data)
        
        # Exponential-ish growth speed
        time.sleep(0.1)
        current_multiplier += (current_multiplier * 0.05)
        
    st.error(f"💥 CRASHED at {crash_point:.2f}x")
    st.info(f"Final Hash: {hashlib.sha256((server_seed + client_seed).encode()).hexdigest()}")


# allow running this file directly for testing without Streamlit
if __name__ == "__main__":
    print("Demo crash point:", calculate_crash_point(
        "random_server_string_123", "player_seed_abc"))
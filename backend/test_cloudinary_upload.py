"""Test Cloudinary upload with signature"""
import cloudinary
import cloudinary.utils
import cloudinary.uploader
import time
import os

# Configure
cloudinary.config(
    cloud_name='c7kila6e',
    api_key='798548655153374',
    api_secret='MdI733_8fUZNm3MO6bNfRYe7AC',
    secure=True
)

print("Testing Cloudinary upload...")
print("=" * 60)

# Test 1: Generate signature
timestamp = int(time.time())
params = {
    'timestamp': timestamp,
    'folder': 'creativepulse/test',
    'public_id': 'test_creative_001'
}

signature = cloudinary.utils.api_sign_request(params, 'MdI733_8fUZNm3MO6bNfRYe7AC')

print(f"\n1. Generated signature:")
print(f"   Params: {params}")
print(f"   Signature: {signature}")
print(f"   API Key: 798548655153374")

# Test 2: Try to upload using the SDK (this should work)
print(f"\n2. Testing SDK upload...")
try:
    # Create a small test image
    from PIL import Image
    import io
    
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    result = cloudinary.uploader.upload(
        img_bytes,
        folder='creativepulse/test',
        public_id='test_creative_sdk',
        resource_type='image'
    )
    
    print(f"   ✓ SDK upload successful!")
    print(f"   Public ID: {result['public_id']}")
    print(f"   URL: {result['secure_url']}")
except Exception as e:
    print(f"   ✗ SDK upload failed: {e}")

# Test 3: Simulate what the frontend does
print(f"\n3. Simulating frontend upload (signed)...")
print(f"   This is what should be sent to:")
print(f"   POST https://api.cloudinary.com/v1_1/c7kila6e/image/upload")
print(f"   ")
print(f"   FormData:")
print(f"     file: [binary data]")
print(f"     timestamp: {timestamp}")
print(f"     folder: {params['folder']}")
print(f"     public_id: {params['public_id']}")
print(f"     signature: {signature}")
print(f"     api_key: 798548655153374")
print(f"")
print(f"   These parameters (timestamp, folder, public_id) were signed.")
print(f"   Cloudinary will reconstruct the signature and compare.")

# Test 4: Verify credentials
print(f"\n4. Verifying credentials...")
try:
    # Try to get account info
    result = cloudinary.api.ping()
    print(f"   ✓ Credentials are valid!")
    print(f"   Ping result: {result}")
except Exception as e:
    print(f"   ✗ Credentials invalid: {e}")

print("\n" + "=" * 60)
print("Test complete!")

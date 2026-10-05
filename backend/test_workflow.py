"""
Test script to verify the complete analysis workflow:
1. Create analysis
2. Upload CSV
3. Register assets
4. Run analysis
5. Verify status transitions
"""
import requests
import time
import json

BASE_URL = "http://localhost:8000/api"

def test_workflow():
    print("=" * 80)
    print("TESTING COMPLETE ANALYSIS WORKFLOW")
    print("=" * 80)
    
    # Step 1: Create user and login
    print("\n[1] Creating demo user and logging in...")
    signup_data = {
        "email": "workflow_test@example.com",
        "password": "testpassword123"
    }
    
    # Try to signup (might already exist)
    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json=signup_data)
        if response.status_code == 201:
            print("✓ User created successfully")
        elif response.status_code == 400:
            print("ℹ User already exists, logging in...")
    except Exception as e:
        print(f"✗ Signup failed: {e}")
    
    # Login
    response = requests.post(f"{BASE_URL}/auth/login", json=signup_data)
    if response.status_code != 200:
        print(f"✗ Login failed: {response.text}")
        return
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"✓ Logged in successfully")
    
    # Step 2: Create analysis
    print("\n[2] Creating analysis...")
    analysis_data = {
        "name": "Workflow Test Analysis",
        "description": "Testing complete pipeline execution"
    }
    response = requests.post(f"{BASE_URL}/analyses", json=analysis_data, headers=headers)
    if response.status_code != 201:
        print(f"✗ Analysis creation failed: {response.text}")
        return
    
    analysis = response.json()
    analysis_id = analysis["id"]
    print(f"✓ Analysis created: ID={analysis_id}, Status={analysis['status']}")
    
    # Step 3: Upload CSV performance data
    print("\n[3] Uploading performance data...")
    csv_data = """creative_id,platform,impressions,clicks,conversions,spend,revenue,date
creative_001,facebook,10000,500,50,100.00,500.00,2024-01-01
creative_002,facebook,15000,750,75,150.00,750.00,2024-01-01
creative_003,instagram,20000,1000,100,200.00,1000.00,2024-01-01
creative_004,instagram,25000,1250,125,250.00,1250.00,2024-01-01
creative_005,google,30000,1500,150,300.00,1500.00,2024-01-01
creative_006,google,12000,600,60,120.00,600.00,2024-01-02
creative_007,facebook,18000,900,90,180.00,900.00,2024-01-02
creative_008,instagram,22000,1100,110,220.00,1100.00,2024-01-02
creative_009,google,28000,1400,140,280.00,1400.00,2024-01-02
creative_010,facebook,32000,1600,160,320.00,1600.00,2024-01-02
"""
    
    files = {"file": ("test_data.csv", csv_data, "text/csv")}
    response = requests.post(
        f"{BASE_URL}/analyses/{analysis_id}/performance/upload",
        files=files,
        headers=headers
    )
    
    if response.status_code != 200:
        print(f"✗ CSV upload failed: {response.text}")
        return
    
    upload_result = response.json()
    print(f"✓ Uploaded {upload_result['records_created']} performance records")
    print(f"  Creative IDs: {', '.join(upload_result.get('creative_ids', []))}")
    
    # Check status after CSV upload
    response = requests.get(f"{BASE_URL}/analyses/{analysis_id}/status", headers=headers)
    status_after_csv = response.json()
    print(f"  Status after CSV upload: {status_after_csv['status']}")
    
    # Step 4: Register assets (simulating real Cloudinary uploads)
    print("\n[4] Registering creative assets...")
    # For this test, we'll register a mix of real and placeholder assets
    
    # Register 5 "real" Cloudinary assets
    real_assets = 0
    for i in range(1, 6):
        asset_data = {
            "creative_id": f"creative_{i:03d}",
            "filename": f"creative_{i:03d}.jpg",
            "cloudinary_public_id": f"test/creative_{i:03d}",
            "cloudinary_url": f"http://res.cloudinary.com/test/image/upload/creative_{i:03d}.jpg",
            "secure_url": f"https://res.cloudinary.com/test/image/upload/creative_{i:03d}.jpg",
            "width": 1920,
            "height": 1080,
            "format": "jpg",
            "bytes": 245678,
            "source": "cloudinary"
        }
        response = requests.post(
            f"{BASE_URL}/analyses/{analysis_id}/assets/register",
            json=asset_data,
            headers=headers
        )
        if response.status_code in [200, 201]:
            real_assets += 1
    
    print(f"✓ Registered {real_assets} real assets (cloudinary)")
    
    # Check status after assets
    response = requests.get(f"{BASE_URL}/analyses/{analysis_id}/status", headers=headers)
    status_after_assets = response.json()
    print(f"  Status after asset registration: {status_after_assets['status']}")
    
    # Step 5: Run the analysis
    print("\n[5] Running analysis pipeline...")
    response = requests.post(f"{BASE_URL}/analyses/{analysis_id}/run", headers=headers)
    
    if response.status_code != 200:
        print(f"✗ Run analysis failed: {response.text}")
        return
    
    run_result = response.json()
    print(f"✓ Analysis pipeline started")
    print(f"  Status: {run_result['status']}")
    print(f"  Stage: {run_result['current_stage']}")
    
    # Step 6: Poll for completion
    print("\n[6] Polling for completion...")
    max_wait = 30  # seconds
    poll_interval = 2  # seconds
    elapsed = 0
    
    while elapsed < max_wait:
        time.sleep(poll_interval)
        elapsed += poll_interval
        
        response = requests.get(f"{BASE_URL}/analyses/{analysis_id}/status", headers=headers)
        status = response.json()
        
        print(f"  [{elapsed}s] Status: {status['status']}, Stage: {status.get('current_stage', 'N/A')}")
        
        if status['status'] == 'completed':
            print(f"\n✓ ANALYSIS COMPLETED SUCCESSFULLY!")
            break
        elif status['status'] == 'failed':
            print(f"\n✗ ANALYSIS FAILED: {status.get('error_message', 'Unknown error')}")
            return
    
    if elapsed >= max_wait:
        print(f"\n⚠ Analysis still processing after {max_wait}s (may need more time)")
    
    # Step 7: Verify results
    print("\n[7] Verifying analysis results...")
    
    # Get overview
    response = requests.get(f"{BASE_URL}/analyses/{analysis_id}/overview", headers=headers)
    if response.status_code == 200:
        overview = response.json()
        print(f"✓ Overview loaded:")
        print(f"  Total creatives: {overview['total_creatives']}")
        print(f"  Total records: {overview['total_records']}")
        agg = overview['aggregate_metrics']
        print(f"  Total spend: ${agg['total_spend']:.2f}")
        print(f"  Total revenue: ${agg['total_revenue']:.2f}")
        print(f"  ROAS: {agg['roas']:.2f}x" if agg['roas'] else "  ROAS: N/A")
    else:
        print(f"✗ Failed to load overview: {response.text}")
    
    # Get Creative DNA
    response = requests.get(f"{BASE_URL}/analyses/{analysis_id}/creative-dna", headers=headers)
    if response.status_code == 200:
        dna = response.json()
        print(f"✓ Creative DNA: {len(dna)} insights generated")
        if len(dna) > 0:
            for insight in dna[:3]:
                print(f"  - {insight['feature_name']} → {insight['metric_name']}: {insight['evidence_tier']}")
    else:
        print(f"⚠ Creative DNA: {response.text}")
    
    print("\n" + "=" * 80)
    print("WORKFLOW TEST COMPLETED")
    print("=" * 80)

if __name__ == "__main__":
    try:
        test_workflow()
    except Exception as e:
        print(f"\n✗ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()

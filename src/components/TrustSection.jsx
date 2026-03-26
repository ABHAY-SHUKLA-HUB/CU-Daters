import React from 'react';

export default function TrustSection() {
  return (
    <section className="py-12 bg-white border-t-4 border-blushPink">
      <div className="max-w-6xl mx-auto px-4">
        
        <h2 className="text-2xl md:text-3xl font-bold text-center text-darkBrown mb-2">
          Verified. Safe. Real.
        </h2>
        <p className="text-center text-softBrown mb-12 max-w-2xl mx-auto">
          SeeU-Daters uses the strictest verification process. Every profile is checked for authenticity. That's why we have <strong>zero fake profiles reported in the last 90 days.</strong>
        </p>
        
        {/* 4-Step Verification Process */}
        <div className="grid md:grid-cols-4 gap-4">
          
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blushPink text-white rounded-full 
                            flex items-center justify-center mx-auto mb-4 
                            text-2xl font-bold">
              1
            </div>
            <h4 className="font-bold text-darkBrown mb-2 text-sm">Verified Email</h4>
            <p className="text-xs text-softBrown">Ownership confirmation</p>
          </div>
          
          {/* Step 2 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blushPink text-white rounded-full 
                            flex items-center justify-center mx-auto mb-4 
                            text-2xl font-bold">
              2
            </div>
            <h4 className="font-bold text-darkBrown mb-2 text-sm">Face ID Verified</h4>
            <p className="text-xs text-softBrown">Liveness detection</p>
          </div>
          
          {/* Step 3 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blushPink text-white rounded-full 
                            flex items-center justify-center mx-auto mb-4 
                            text-2xl font-bold">
              3
            </div>
            <h4 className="font-bold text-darkBrown mb-2 text-sm">Government ID Check</h4>
            <p className="text-xs text-softBrown">Admin review in 24h</p>
          </div>
          
          {/* Step 4 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 text-white rounded-full 
                            flex items-center justify-center mx-auto mb-4 
                            text-2xl font-bold">
              ✓
            </div>
            <h4 className="font-bold text-darkBrown mb-2 text-sm">Profile Active</h4>
            <p className="text-xs text-softBrown">You're verified!</p>
          </div>
          
        </div>
      </div>
    </section>
  );
}


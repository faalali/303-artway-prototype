import { useState } from 'react';

const steps = [
  'About You',
  'Creative Work',
  'Needs & Opportunities',
  'Supporting Materials',
  'Review & Submit'
];

export default function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});

  function nextStep() {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }

  function previousStep() {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Step Indicators */}
      <div className="flex gap-2 mb-8 overflow-x-auto" style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        {steps.map((step, index) => (
          <div
            key={step}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '999px',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              transition: 'all 0.3s ease',
              background: currentStep >= index ? 'var(--accent-terracotta)' : 'rgba(255,255,255,0.04)',
              color: currentStep >= index ? '#fff' : 'var(--text-secondary)',
              border: currentStep >= index ? '1px solid var(--accent-terracotta)' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: currentStep === index ? '0 0 12px rgba(224, 90, 71, 0.3)' : 'none'
            }}
          >
            {index + 1}. {step}
          </div>
        ))}
      </div>

      {/* Main Form Content */}
      <div className="bg-white rounded-3xl shadow-xl p-8" style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '24px',
        padding: '2.5rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        <h2 className="text-2xl font-bold mb-6" style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          marginBottom: '1.5rem',
          color: '#fff',
          fontFamily: "'Space Grotesk', sans-serif"
        }}>
          {steps[currentStep]}
        </h2>

        <div className="space-y-4" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            className="w-full border rounded-2xl p-4"
            placeholder="Your Name"
            value={formData.name || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value
              })
            }
            style={{
              width: '100%',
              padding: '1rem',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border 0.2s'
            }}
          />
        </div>

        {/* Form Controls */}
        <div className="flex justify-between mt-8" style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '2rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '1.5rem'
        }}>
          <button
            onClick={previousStep}
            disabled={currentStep === 0}
            style={{
              padding: '0.8rem 1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent',
              color: '#fff',
              fontWeight: 700,
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              opacity: currentStep === 0 ? 0.5 : 1,
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            Back
          </button>

          <button
            onClick={nextStep}
            disabled={currentStep === steps.length - 1}
            style={{
              padding: '0.8rem 1.5rem',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--accent-electric)',
              color: '#fff',
              fontWeight: 700,
              cursor: currentStep === steps.length - 1 ? 'not-allowed' : 'pointer',
              opacity: currentStep === steps.length - 1 ? 0.5 : 1,
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: '0 4px 12px rgba(74, 131, 237, 0.3)'
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

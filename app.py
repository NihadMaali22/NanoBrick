from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import random
import math
import time
import os
import logging
import numpy as np

from qiskit import QuantumCircuit
from qiskit.primitives import StatevectorEstimator
from qiskit.quantum_info import SparsePauliOp
from scipy.optimize import minimize

import llm_service

logging.basicConfig(level=logging.INFO)

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

class QuantumVQEOptimizer:
    
    def __init__(self, num_qubits=4):
        self.num_qubits = num_qubits
        self.estimator = StatevectorEstimator()
        self.energy_history = []
        
    def create_ansatz(self, params):
        qc = QuantumCircuit(self.num_qubits)
        param_idx = 0
        
        for i in range(self.num_qubits):
            qc.ry(params[param_idx], i)
            param_idx += 1
            qc.rz(params[param_idx], i)
            param_idx += 1
        
        for i in range(self.num_qubits - 1):
            qc.cx(i, i + 1)
        
        for i in range(self.num_qubits):
            qc.ry(params[param_idx], i)
            param_idx += 1
            qc.rz(params[param_idx], i)
            param_idx += 1
        
        for i in range(self.num_qubits - 1):
            qc.cx(i + 1, i)
        
        for i in range(self.num_qubits):
            qc.ry(params[param_idx], i)
            param_idx += 1
        
        return qc
    
    def create_hamiltonian(self, fiber_ratio, binding_energy):
        zz_coeff = -1.0 - (fiber_ratio / 100) * 0.5
        xx_coeff = -0.5 - (binding_energy / 100) * 0.3
        z_coeff = 0.2
        
        pauli_list = []
        
        for i in range(self.num_qubits - 1):
            pauli_str = ['I'] * self.num_qubits
            pauli_str[i] = 'Z'
            pauli_str[i + 1] = 'Z'
            pauli_list.append((''.join(pauli_str), zz_coeff))
        
        for i in range(self.num_qubits - 1):
            pauli_str = ['I'] * self.num_qubits
            pauli_str[i] = 'X'
            pauli_str[i + 1] = 'X'
            pauli_list.append((''.join(pauli_str), xx_coeff))
        
        for i in range(self.num_qubits):
            pauli_str = ['I'] * self.num_qubits
            pauli_str[i] = 'Z'
            pauli_list.append((''.join(pauli_str), z_coeff / self.num_qubits))
        
        return SparsePauliOp.from_list(pauli_list)
    
    def compute_energy(self, params, hamiltonian):
        circuit = self.create_ansatz(params)
        job = self.estimator.run([(circuit, hamiltonian)])
        result = job.result()
        energy = float(result[0].data.evs)
        self.energy_history.append(energy)
        return energy
    
    def optimize(self, fiber_ratio, binding_energy, max_iter=50):
        self.energy_history = []
        
        num_params = self.num_qubits * 5
        
        hamiltonian = self.create_hamiltonian(fiber_ratio, binding_energy)
        
        initial_params = np.random.uniform(-np.pi, np.pi, num_params)
        initial_energy = self.compute_energy(initial_params, hamiltonian)
        
        result = minimize(
            lambda p: self.compute_energy(p, hamiltonian),
            initial_params,
            method='COBYLA',
            options={'maxiter': max_iter, 'rhobeg': 0.5}
        )
        
        optimal_energy = result.fun
        optimal_params = result.x
        
        final_circuit = self.create_ansatz(optimal_params)
        
        return {
            'initial_energy': float(initial_energy),
            'optimal_energy': float(optimal_energy),
            'iterations': len(self.energy_history),
            'energy_history': [float(e) for e in self.energy_history],
            'optimal_params': optimal_params.tolist(),
            'circuit_depth': final_circuit.depth(),
            'num_gates': sum(final_circuit.count_ops().values()),
            'converged': result.success
        }


quantum_optimizer = QuantumVQEOptimizer(num_qubits=4)

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/lab')
def serve_lab():
    return send_from_directory('.', 'lab.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/status', methods=['GET'])
def get_status():
    llm_ready = llm_service.is_available()
    return jsonify({
        'status': 'online',
        'version': '2.0.0',
        'services': {
            'ai_classifier': 'active (LLM)' if llm_ready else 'active (fallback)',
            'quantum_optimizer': 'active',
            'material_calculator': 'active (LLM)' if llm_ready else 'active (fallback)',
            'llm_backend': 'Google Gemini' if llm_ready else 'not configured'
        },
        'llm_available': llm_ready,
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S')
    })

@app.route('/api/classify', methods=['POST'])
def classify_waste():
    data = request.get_json() or {}
    waste_type = data.get('wasteType', 'banana')
    condition = data.get('condition', 'moderate')

    start_time = time.time()

    if llm_service.is_available():
        try:
            llm_data = llm_service.classify_waste(waste_type, condition)
            processing_time = int((time.time() - start_time) * 1000)

            props = {}
            for k, v in llm_data.get('properties', {}).items():
                if isinstance(v, (int, float)):
                    props[k] = round(v, 2)
                elif v is not None:
                    props[k] = v

            return jsonify({
                'success': True,
                'ai_powered': True,
                'model': 'Google Gemini',
                'classification': {
                    'type': llm_data.get('type', f'Agricultural Waste ({waste_type})'),
                    'category': llm_data.get('category', 'Organic Material'),
                    'properties': props
                },
                'ripeness': llm_data.get('ripeness', {'level': condition, 'usability': 75}),
                'damage_assessment': llm_data.get('damage_assessment', {
                    'level': condition,
                    'processable': True,
                    'recommended_process': 'standard',
                    'explanation': ''
                }),
                'ai_analysis': llm_data.get('ai_analysis', ''),
                'confidence': llm_data.get('confidence', 90),
                'processing_time_ms': processing_time
            })
        except Exception as exc:
            logging.warning('LLM classify failed, using fallback: %s', exc)

    time.sleep(0.5)

    classifications = {
        'banana': {
            'type': 'Musa acuminata (Banana)',
            'category': 'Fruit Waste - High Fiber',
            'fiber_content': random.uniform(35, 45),
            'starch_content': random.uniform(18, 25),
            'moisture': random.uniform(70, 85)
        },
        'date': {
            'type': 'Phoenix dactylifera (Date Palm)',
            'category': 'Fruit Waste - High Sugar',
            'fiber_content': random.uniform(8, 15),
            'sugar_content': random.uniform(60, 75),
            'moisture': random.uniform(15, 25)
        },
        'mixed': {
            'type': 'Mixed Agricultural Waste',
            'category': 'Composite Organic Material',
            'fiber_content': random.uniform(20, 30),
            'starch_content': random.uniform(15, 22),
            'moisture': random.uniform(40, 60)
        }
    }

    ripeness_levels = {
        'fresh': {'level': 'Stage 1 - Fresh', 'usability': 95},
        'moderate': {'level': 'Stage 2 - Moderate Decay', 'usability': 85},
        'spoiled': {'level': 'Stage 3 - Advanced Decay', 'usability': 70},
        'severe': {'level': 'Stage 4 - Severe Decay', 'usability': 55}
    }

    classification = classifications.get(waste_type, classifications['banana'])
    ripeness = ripeness_levels.get(condition, ripeness_levels['moderate'])

    base_confidence = 92 + random.uniform(-3, 5)
    confidence = min(98, base_confidence)

    return jsonify({
        'success': True,
        'ai_powered': False,
        'model': 'rule-based fallback',
        'classification': {
            'type': classification['type'],
            'category': classification['category'],
            'properties': {k: round(v, 2) for k, v in classification.items() if k not in ['type', 'category']}
        },
        'ripeness': ripeness,
        'damage_assessment': {
            'level': condition,
            'processable': ripeness['usability'] > 50,
            'recommended_process': 'enzymatic_treatment' if condition in ['spoiled', 'severe'] else 'standard'
        },
        'ai_analysis': '',
        'confidence': round(confidence, 1),
        'processing_time_ms': random.randint(150, 350)
    })

@app.route('/api/optimize', methods=['POST'])
def quantum_optimize():
    data = request.get_json() or {}
    fiber_ratio = data.get('fiberRatio', 40)
    binding_energy = data.get('bindingEnergy', 50)
    iterations = data.get('iterations', 50)
    
    start_time = time.time()
    
    try:
        vqe_result = quantum_optimizer.optimize(
            fiber_ratio=fiber_ratio,
            binding_energy=binding_energy,
            max_iter=min(iterations, 100)
        )
        
        processing_time = int((time.time() - start_time) * 1000)
        
        initial = vqe_result['initial_energy']
        optimal = vqe_result['optimal_energy']
        energy_reduction = abs((initial - optimal) / abs(initial) * 100) if initial != 0 else 0
        
        energy_history = []
        step_size = max(1, len(vqe_result['energy_history']) // 10)
        for i, energy in enumerate(vqe_result['energy_history']):
            if i % step_size == 0:
                energy_history.append({
                    'iteration': i,
                    'energy': round(energy, 6)
                })
        
        ground_state_factor = abs(optimal) / 3.0
        optimal_config = {
            'cellulose_alignment': round(70 + fiber_ratio * 0.3 + ground_state_factor * 10, 1),
            'polymer_binding': round(60 + binding_energy * 0.4 + ground_state_factor * 8, 1),
            'nanofiber_distribution': round(75 + (fiber_ratio + binding_energy) * 0.1 + ground_state_factor * 5, 1),
            'crystallinity_index': round(80 + ground_state_factor * 15, 1)
        }
        
        return jsonify({
            'success': True,
            'real_quantum': True,
            'optimization': {
                'initial_energy': round(initial, 6),
                'optimal_energy': round(optimal, 6),
                'energy_reduction': round(energy_reduction, 2),
                'iterations_completed': vqe_result['iterations'],
                'convergence_achieved': vqe_result['converged']
            },
            'quantum_metrics': {
                'qubits_used': quantum_optimizer.num_qubits,
                'circuit_depth': vqe_result['circuit_depth'],
                'gate_count': vqe_result['num_gates'],
                'backend': 'Qiskit StatevectorEstimator',
                'ansatz': 'RY-RZ with CNOT entanglement'
            },
            'optimal_configuration': optimal_config,
            'energy_history': energy_history,
            'algorithm': 'Real VQE with COBYLA optimizer (Qiskit)',
            'processing_time_ms': processing_time
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Quantum optimization failed'
        }), 500

@app.route('/api/calculate', methods=['POST'])
def calculate_materials():
    data = request.get_json() or {}

    banana_fiber = data.get('banana', 40)
    date_paste = data.get('date', 25)
    starch = data.get('starch', 20)
    ash = data.get('ash', 10)
    nanocellulose = data.get('nano', 5)

    total = banana_fiber + date_paste + starch + ash + nanocellulose

    if total != 100:
        factor = 100 / total
        banana_fiber *= factor
        date_paste *= factor
        starch *= factor
        ash *= factor
        nanocellulose *= factor

    start_time = time.time()

    if llm_service.is_available():
        try:
            llm_data = llm_service.predict_materials(
                banana=round(banana_fiber, 1),
                date=round(date_paste, 1),
                starch=round(starch, 1),
                ash=round(ash, 1),
                nano=round(nanocellulose, 1)
            )
            processing_time = int((time.time() - start_time) * 1000)

            return jsonify({
                'success': True,
                'ai_powered': True,
                'model': 'Google Gemini',
                'composition': {
                    'banana_fiber': round(banana_fiber, 1),
                    'date_paste': round(date_paste, 1),
                    'banana_starch': round(starch, 1),
                    'agricultural_ash': round(ash, 1),
                    'nanocellulose': round(nanocellulose, 1)
                },
                'properties': llm_data.get('properties', {}),
                'sustainability': llm_data.get('sustainability', {}),
                'quality': llm_data.get('quality', {}),
                'ai_analysis': llm_data.get('ai_analysis', ''),
                'dimensions': {
                    'standard': '240 × 115 × 75 mm',
                    'weight_per_unit': round(
                        llm_data.get('properties', {}).get('density', {}).get('value', 1200) * 0.00207, 2
                    )
                },
                'processing_time_ms': processing_time
            })
        except Exception as exc:
            logging.warning('LLM calculate failed, using fallback: %s', exc)

    base_strength = 15
    strength = base_strength + (banana_fiber * 0.3) + (nanocellulose * 2.5) + (starch * 0.1)
    strength = min(45, strength + random.uniform(-2, 2))
    
    base_thermal = 1.5
    thermal = base_thermal + (banana_fiber * 0.02) + (ash * 0.05) + (nanocellulose * 0.1)
    thermal = min(4.0, thermal + random.uniform(-0.1, 0.1))
    
    base_density = 1200
    density = base_density - (banana_fiber * 5) + (date_paste * 3) + (ash * 8)
    density = max(800, min(1600, density + random.uniform(-50, 50)))
    
    fire_resistance = 0.5 + (ash * 0.15) + (nanocellulose * 0.1)
    fire_resistance = min(4.0, fire_resistance)
    
    water_absorption = 15 - (nanocellulose * 0.8) - (starch * 0.1)
    water_absorption = max(5, water_absorption + random.uniform(-1, 1))
    
    biodegradability = 85 + (banana_fiber * 0.2) + (date_paste * 0.15) - (ash * 0.3)
    biodegradability = min(100, max(70, biodegradability))
    
    carbon_reduction = 60 + (banana_fiber * 0.3) + (nanocellulose * 0.5)
    carbon_reduction = min(95, carbon_reduction + random.uniform(-3, 3))
    
    quality_score = (strength / 45 * 30) + (thermal / 4 * 20) + (fire_resistance / 4 * 25) + (carbon_reduction / 95 * 25)
    if quality_score >= 85:
        grade = 'A+'
    elif quality_score >= 75:
        grade = 'A'
    elif quality_score >= 65:
        grade = 'B+'
    elif quality_score >= 55:
        grade = 'B'
    else:
        grade = 'C'
    
    return jsonify({
        'success': True,
        'ai_powered': False,
        'model': 'rule-based fallback',
        'composition': {
            'banana_fiber': round(banana_fiber, 1),
            'date_paste': round(date_paste, 1),
            'banana_starch': round(starch, 1),
            'agricultural_ash': round(ash, 1),
            'nanocellulose': round(nanocellulose, 1)
        },
        'properties': {
            'compressive_strength': {
                'value': round(strength, 1),
                'unit': 'MPa',
                'rating': 'Excellent' if strength > 30 else 'Good' if strength > 20 else 'Standard'
            },
            'thermal_resistance': {
                'value': round(thermal, 2),
                'unit': 'R-value/inch',
                'rating': 'Excellent' if thermal > 3 else 'Good' if thermal > 2 else 'Standard'
            },
            'density': {
                'value': round(density, 0),
                'unit': 'kg/m³',
                'category': 'Lightweight' if density < 1000 else 'Medium' if density < 1400 else 'Heavy'
            },
            'fire_resistance': {
                'value': round(fire_resistance, 1),
                'unit': 'hours',
                'class': 'Class A' if fire_resistance > 2 else 'Class B' if fire_resistance > 1 else 'Class C'
            },
            'water_absorption': {
                'value': round(water_absorption, 1),
                'unit': '%',
                'rating': 'Excellent' if water_absorption < 8 else 'Good' if water_absorption < 12 else 'Standard'
            }
        },
        'sustainability': {
            'biodegradability': round(biodegradability, 1),
            'carbon_reduction': round(carbon_reduction, 1),
            'eco_score': round((biodegradability + carbon_reduction) / 2, 1)
        },
        'quality': {
            'score': round(quality_score, 1),
            'grade': grade
        },
        'ai_analysis': '',
        'dimensions': {
            'standard': '240 × 115 × 75 mm',
            'weight_per_unit': round(density * 0.00207, 2)
        }
    })

@app.route('/api/extract', methods=['POST'])
def extract_nanofiber():
    data = request.get_json() or {}
    source = data.get('source', 'banana')
    treatment = data.get('treatment', 'enzymatic')
    duration = data.get('duration', 60)
    
    time.sleep(0.6)
    
    base_yield = 75 if source == 'banana' else 45
    treatment_bonus = {'enzymatic': 10, 'chemical': 15, 'mechanical': 5}
    duration_factor = min(1.2, 0.8 + duration / 200)
    
    final_yield = base_yield + treatment_bonus.get(treatment, 10)
    final_yield = final_yield * duration_factor + random.uniform(-5, 5)
    final_yield = min(95, max(50, final_yield))
    
    diameter = 20 + random.uniform(0, 60)
    crystallinity = 80 + random.uniform(-5, 10)
    aspect_ratio = 100 + random.uniform(0, 200)
    
    return jsonify({
        'success': True,
        'extraction': {
            'source': source,
            'treatment': treatment,
            'duration_min': duration,
            'yield_percentage': round(final_yield, 1)
        },
        'fiber_properties': {
            'diameter_nm': round(diameter, 1),
            'crystallinity': round(crystallinity, 1),
            'aspect_ratio': round(aspect_ratio, 0),
            'purity': round(90 + random.uniform(0, 8), 1)
        },
        'quality_indicators': {
            'uniformity': round(85 + random.uniform(-10, 10), 1),
            'tensile_strength': round(150 + random.uniform(-20, 50), 0),
            'surface_area': round(300 + random.uniform(-50, 100), 0)
        }
    })

if __name__ == '__main__':
    print("""
    ============================================================
    
       NanoBrick API Server
       ----------------------------------------------------------
    
       Server running at: http://localhost:5000
       Lab Dashboard:     http://localhost:5000/lab
    
       API Endpoints:
       - GET  /api/status     - System status
       - POST /api/classify   - AI waste classification
       - POST /api/optimize   - Quantum optimization
       - POST /api/calculate  - Material calculator
       - POST /api/extract    - Nanofiber extraction
    
    ============================================================
    """)
    app.run(debug=True, host='0.0.0.0', port=5000)

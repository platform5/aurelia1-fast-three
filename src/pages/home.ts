import { inject, BindingEngine, bindable } from 'aurelia-framework';
import { Three } from './../resources';
import { DynamicDataModel } from './../aurelia-deco';

// Potree
import { AmbientLight, Box3, BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Raycaster, Scene, SphereGeometry, Vector2, Vector3, WebGLRenderer } from 'three';
import { PointCloudOctree, PointSizeType, Potree } from 'potree-core';


@inject(Element, BindingEngine)
export class Home {

  public three: Three;
  public potree = new Potree();
	public pointClouds: PointCloudOctree[] = [];
  
  private cube: Mesh;

  constructor(private element: Element, private bindingEngine: BindingEngine) {
  }

  public async attached(): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 800));
      this.iniPointCloud();
  }

  private async clic(): Promise<void> { 
    console.log('clic');

    await this.getLinks();

  }

  public links: Array<DynamicDataModel> = [];
  public async getLinks() {

    let prefix: string = `?limit=50`;
    await DynamicDataModel.use('link').getAll(prefix).then((link) => {
      if (link) {
        this.links = link;
      }
    });
  }

  private async iniPointCloud(): Promise<void> {

    console.log('Load');
    const geometry = new BoxGeometry(35, 0.1, 35);
    const material = new MeshBasicMaterial({ color: 0x663300 });
    this.cube = new Mesh(geometry, material);
    this.cube.position.x = 15;
    this.cube.position.y = -0.9;
    this.three.scene.scene.add(this.cube);
  

    
    await this.loadPointCloud('https://pointclouds.swissdata.io/sextant/villa-sextant/', 'cloud.js', new Vector3(8, -3, 0.0));
    this.potree.pointBudget = 5_000_000;
    this.loop();
  }

  
  private async loadPointCloud(baseUrl: string, url: string, position: Vector3)
	{
			const loadPotree = this.potree.loadPointCloud(url, url => `${baseUrl}${url}`,).then((pointcloud: PointCloudOctree) => {
				pointcloud.material.size = 1.0;
				pointcloud.material.shape = 2;
				pointcloud.material.inputColorEncoding = 1;
				pointcloud.material.outputColorEncoding = 1;
        // pointcloud.boundingBox = new Box3(new Vector3(0,0,0), new Vector3(1,1,1));
        pointcloud.castShadow = true;
        pointcloud.pointSizeType = PointSizeType.ADAPTIVE;
        // pointcloud.updateBoundingBoxes();
        // pointcloud.material.pointOpacityType = 0.5;
				// pointcloud.position.set(0, -2, 1)
				// pointcloud.scale.set(0.1, 0.1, 0.1);
				pointcloud.rotateOnAxis(new Vector3(-1,0,0), Math.PI/2);
				if (position)
				{
					pointcloud.position.copy(position);
				}

        this.add(pointcloud);

			});

      console.log('potree', loadPotree);
	}

  public add(pco: PointCloudOctree) {
		this.three.scene.scene.add(pco);
		this.pointClouds.push(pco);
	}

  private clear(): void {

    console.log('Clear');
    this.three.scene.scene.clear();

  }

  

  private loop(): void {
		// this.cube.rotation.y += 0.01;

		this.potree.updatePointClouds(this.pointClouds, this.three.scene.camera, this.three.scene.renderer);
    this.three.scene.controls.update();
    this.three.scene.renderer.render( this.three.scene.scene,  this.three.scene.camera);

    window.requestAnimationFrame(()=>{
      this.loop()
    });
	}

}
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IatfComponent } from './iatf.component';

describe('IatfComponent', () => {
  let component: IatfComponent;
  let fixture: ComponentFixture<IatfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IatfComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IatfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
